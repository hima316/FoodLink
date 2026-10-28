import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { connectDB, disconnectDB } from '../config/database';
import Donation from '../models/Donation';
import User from '../models/User';
import Notification from '../models/Notification';
import { generateAccessToken } from '../utils/jwt';

describe('Donation Concurrency & Database Consistency Test Suite', () => {
  let donorUser: any;
  let donorToken: string;
  let ngoUser1: any;
  let ngoToken1: string;
  let ngoUser2: any;
  let ngoToken2: string;
  let volunteerUser1: any;
  let volunteerToken1: string;
  let volunteerUser2: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean up any stale test fixtures
    await User.deleteMany({ email: /@test-concurrency\.org$/ });
    await Donation.deleteMany({ title: /^TEST_CONCURRENCY_/ });
    await Notification.deleteMany({ title: /TEST_CONCURRENCY_/ });

    // Seed test users
    donorUser = await User.create({
      name: 'Test Hotel Donor',
      email: `donor_${Date.now()}@test-concurrency.org`,
      password: 'password123',
      role: 'hotel',
      organizationName: 'Grand Hotel Test',
      status: 'active',
    });
    donorToken = generateAccessToken({
      userId: donorUser._id.toString(),
      email: donorUser.email,
      role: donorUser.role,
    });

    ngoUser1 = await User.create({
      name: 'Test NGO One',
      email: `ngo1_${Date.now()}@test-concurrency.org`,
      password: 'password123',
      role: 'ngo',
      organizationName: 'Hope Kitchen Test',
      status: 'active',
      totalReceived: 0,
    });
    ngoToken1 = generateAccessToken({
      userId: ngoUser1._id.toString(),
      email: ngoUser1.email,
      role: ngoUser1.role,
    });

    ngoUser2 = await User.create({
      name: 'Test NGO Two',
      email: `ngo2_${Date.now()}@test-concurrency.org`,
      password: 'password123',
      role: 'ngo',
      organizationName: 'City Shelter Test',
      status: 'active',
      totalReceived: 0,
    });
    ngoToken2 = generateAccessToken({
      userId: ngoUser2._id.toString(),
      email: ngoUser2.email,
      role: ngoUser2.role,
    });

    volunteerUser1 = await User.create({
      name: 'Volunteer Test One',
      email: `vol1_${Date.now()}@test-concurrency.org`,
      password: 'password123',
      role: 'volunteer',
      status: 'active',
      totalPickups: 0,
    });
    volunteerToken1 = generateAccessToken({
      userId: volunteerUser1._id.toString(),
      email: volunteerUser1.email,
      role: volunteerUser1.role,
    });

    volunteerUser2 = await User.create({
      name: 'Volunteer Test Two',
      email: `vol2_${Date.now()}@test-concurrency.org`,
      password: 'password123',
      role: 'volunteer',
      status: 'active',
      totalPickups: 0,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test-concurrency\.org$/ });
    await Donation.deleteMany({ title: /^TEST_CONCURRENCY_/ });
    await Notification.deleteMany({ title: /TEST_CONCURRENCY_/ });
    await disconnectDB();
  });

  const createTestDonation = async (overrides: Record<string, unknown> = {}) => {
    return Donation.create({
      donor: donorUser._id,
      title: `TEST_CONCURRENCY_Meals_${Date.now()}_${Math.random()}`,
      description: 'Fresh prepared meals for testing concurrency',
      category: 'cooked_meals',
      quantity: 25,
      unit: 'portions',
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in future
      pickupDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
      status: 'available',
      address: { city: 'Mumbai', state: 'MH' },
      ...overrides,
    });
  };

  // =========================================================================
  // 1. ATOMIC CLAIMING: Exactly one NGO wins concurrent claim requests
  // =========================================================================
  test('Atomic Claiming: two simultaneous NGO claims result in exactly one 200 and one 409', async () => {
    const donation = await createTestDonation();

    // Trigger both claims simultaneously in true parallel
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/v1/donations/${donation._id}/claim`)
        .set('Authorization', `Bearer ${ngoToken1}`),
      request(app)
        .patch(`/api/v1/donations/${donation._id}/claim`)
        .set('Authorization', `Bearer ${ngoToken2}`),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winnerRes = res1.status === 200 ? res1 : res2;
    const loserRes = res1.status === 409 ? res1 : res2;

    expect(winnerRes.body.success).toBe(true);
    expect(winnerRes.body.data.donation.status).toBe('claimed');
    expect(loserRes.body.success).toBe(false);
    expect(loserRes.body.message).toMatch(/already claimed/i);

    // Verify database state: exactly one NGO is recorded
    const finalDonation = await Donation.findById(donation._id);
    expect(finalDonation?.status).toBe('claimed');
    const winningNgoId = winnerRes === res1 ? ngoUser1._id.toString() : ngoUser2._id.toString();
    const losingNgoId = winnerRes === res1 ? ngoUser2._id.toString() : ngoUser1._id.toString();
    expect(finalDonation?.claimedBy?.toString()).toBe(winningNgoId);

    // Verify user counters: only the winner counter was incremented
    const updatedWinner = await User.findById(winningNgoId);
    const updatedLoser = await User.findById(losingNgoId);
    expect(updatedWinner?.totalReceived).toBe(1);
    expect(updatedLoser?.totalReceived).toBe(0);

    // Verify notifications: only 1 claim notification was created for this donation
    const notifications = await Notification.find({
      'data.donationId': donation._id,
      type: 'donation_claimed',
    });
    expect(notifications.length).toBe(1);
    expect(notifications[0].sender?.toString()).toBe(winningNgoId);
  });

  // =========================================================================
  // 2. HIGH CONCURRENCY CLAIMING: 5 simultaneous claims on a single donation
  // =========================================================================
  test('High Concurrency Claiming: 5 concurrent claims result in exactly 1 success and 4 conflicts', async () => {
    const donation = await createTestDonation();

    // Create 5 test NGOs
    const testNgos = await Promise.all(
      [1, 2, 3, 4, 5].map((i) =>
        User.create({
          name: `Concurrent NGO ${i}`,
          email: `high_ngo_${i}_${Date.now()}@test-concurrency.org`,
          password: 'password123',
          role: 'ngo',
          organizationName: `Concurrent Org ${i}`,
          status: 'active',
          totalReceived: 0,
        })
      )
    );

    const tokens = testNgos.map((ngo) =>
      generateAccessToken({
        userId: ngo._id.toString(),
        email: ngo.email,
        role: ngo.role,
      })
    );

    // Launch 5 simultaneous requests
    const responses = await Promise.all(
      tokens.map((token) =>
        request(app)
          .patch(`/api/v1/donations/${donation._id}/claim`)
          .set('Authorization', `Bearer ${token}`)
      )
    );

    const successCount = responses.filter((r) => r.status === 200).length;
    const conflictCount = responses.filter((r) => r.status === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(4);

    // Verify database integrity
    const finalDonation = await Donation.findById(donation._id);
    expect(finalDonation?.status).toBe('claimed');

    // Total counter sum across all 5 NGOs must be exactly 1
    const refreshedNgos = await User.find({
      _id: { $in: testNgos.map((n) => n._id) },
    });
    const totalReceivedSum = refreshedNgos.reduce(
      (sum, ngo) => sum + (ngo.totalReceived || 0),
      0
    );
    expect(totalReceivedSum).toBe(1);
  });

  // =========================================================================
  // 3. EXPIRED DONATION: Claim attempts on expired items are rejected
  // =========================================================================
  test('Expired Donation: atomic check rejects claims for past-expiry donations with 409', async () => {
    const expiredDonation = await createTestDonation({
      expiryTime: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
    });

    const res = await request(app)
      .patch(`/api/v1/donations/${expiredDonation._id}/claim`)
      .set('Authorization', `Bearer ${ngoToken1}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expired/i);

    const unchanged = await Donation.findById(expiredDonation._id);
    expect(unchanged?.status).toBe('expired');
    expect(unchanged?.claimedBy).toBeFalsy();
  });

  // =========================================================================
  // 4. ATOMIC VOLUNTEER ASSIGNMENT: Conflicting assignments prevent overwrites
  // =========================================================================
  test('Atomic Volunteer Assignment: concurrent volunteer assignments result in only 1 winner', async () => {
    // Donation is claimed by ngoUser1
    const donation = await createTestDonation({
      status: 'claimed',
      claimedBy: ngoUser1._id,
      claimedAt: new Date(),
    });

    // Two assignment requests for different volunteers run simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/v1/donations/${donation._id}/assign-volunteer`)
        .set('Authorization', `Bearer ${ngoToken1}`)
        .send({ volunteerId: volunteerUser1._id.toString() }),
      request(app)
        .patch(`/api/v1/donations/${donation._id}/assign-volunteer`)
        .set('Authorization', `Bearer ${ngoToken1}`)
        .send({ volunteerId: volunteerUser2._id.toString() }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const finalDonation = await Donation.findById(donation._id);
    expect(finalDonation?.status).toBe('in_transit');

    // Only the winning volunteer is assigned
    const winningVolunteer =
      res1.status === 200
        ? volunteerUser1._id.toString()
        : volunteerUser2._id.toString();
    expect(finalDonation?.volunteer?.toString()).toBe(winningVolunteer);
  });

  // =========================================================================
  // 5. ATOMIC DELIVERY & COUNTER IDEMPOTENCY: Retries increment pickups only ONCE
  // =========================================================================
  test('Atomic Delivery: duplicate/retry deliver requests increment totalPickups only once', async () => {
    const donation = await createTestDonation({
      status: 'in_transit',
      claimedBy: ngoUser1._id,
      volunteer: volunteerUser1._id,
      pickedUpAt: new Date(),
    });

    const initialVolunteer = await User.findById(volunteerUser1._id);
    const initialPickups = initialVolunteer?.totalPickups || 0;

    // Send 3 simultaneous / duplicate delivery requests from the assigned volunteer
    const responses = await Promise.all([
      request(app)
        .patch(`/api/v1/donations/${donation._id}/deliver`)
        .set('Authorization', `Bearer ${volunteerToken1}`),
      request(app)
        .patch(`/api/v1/donations/${donation._id}/deliver`)
        .set('Authorization', `Bearer ${volunteerToken1}`),
      request(app)
        .patch(`/api/v1/donations/${donation._id}/deliver`)
        .set('Authorization', `Bearer ${volunteerToken1}`),
    ]);

    const successCount = responses.filter((r) => r.status === 200).length;
    const conflictCount = responses.filter((r) => r.status === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(2);

    // Verify volunteer pickup counter increased by EXACTLY 1 (not 3)
    const finalVolunteer = await User.findById(volunteerUser1._id);
    expect(finalVolunteer?.totalPickups).toBe(initialPickups + 1);

    const finalDonation = await Donation.findById(donation._id);
    expect(finalDonation?.status).toBe('delivered');
    expect(finalDonation?.deliveredAt).toBeDefined();
  });

  // =========================================================================
  // 6. CONCURRENT CANCELLATION VS CLAIM: Deterministic outcome, no hybrid state
  // =========================================================================
  test('Concurrent Cancellation vs Claim: exactly one state transition succeeds cleanly', async () => {
    const donation = await createTestDonation();

    // Donor cancels while NGO claims at the exact same moment
    const [cancelRes, claimRes] = await Promise.all([
      request(app)
        .delete(`/api/v1/donations/${donation._id}`)
        .set('Authorization', `Bearer ${donorToken}`),
      request(app)
        .patch(`/api/v1/donations/${donation._id}/claim`)
        .set('Authorization', `Bearer ${ngoToken1}`),
    ]);

    const finalDonation = await Donation.findById(donation._id);
    expect(['cancelled', 'claimed']).toContain(finalDonation?.status);

    if (finalDonation?.status === 'cancelled') {
      // If cancellation processed first, claim must have been rejected
      expect([200, 409]).toContain(cancelRes.status);
      const ngo = await User.findById(ngoUser1._id);
      // Either NGO claim was rejected (0) or claimed then cancelled compensation ran (-1/0)
      expect(ngo?.totalReceived).toBeLessThanOrEqual(1);
    } else {
      // If claim processed first, donation is claimed
      expect(claimRes.status).toBe(200);
      expect(finalDonation?.claimedBy?.toString()).toBe(ngoUser1._id.toString());
    }
  });

  // =========================================================================
  // 7. ATOMIC VOLUNTEER RATING: Concurrent rating attempts prevent duplicates
  // =========================================================================
  test('Atomic Volunteer Rating: concurrent rating requests result in exactly one 200 and one 409', async () => {
    const donation = await createTestDonation({
      status: 'delivered',
      claimedBy: ngoUser1._id,
      volunteer: volunteerUser1._id,
      deliveredAt: new Date(),
    });

    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/v1/donations/${donation._id}/rate-volunteer`)
        .set('Authorization', `Bearer ${ngoToken1}`)
        .send({ rating: 5, feedback: 'Excellent work!' }),
      request(app)
        .patch(`/api/v1/donations/${donation._id}/rate-volunteer`)
        .set('Authorization', `Bearer ${ngoToken1}`)
        .send({ rating: 4, feedback: 'Fast delivery' }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winnerRes = res1.status === 200 ? res1 : res2;
    const loserRes = res1.status === 409 ? res1 : res2;

    expect(winnerRes.body.success).toBe(true);
    expect(loserRes.body.success).toBe(false);
    expect(loserRes.body.message).toMatch(/Already rated/i);

    const refreshedDonation = await Donation.findById(donation._id);
    expect(refreshedDonation?.ngoRating).toBeDefined();

    const refreshedVolunteer = await User.findById(volunteerUser1._id);
    expect(refreshedVolunteer?.rating).toBeGreaterThan(0);
  });

  // =========================================================================
  // 8. INVALID STATE TRANSITIONS: Strict enforcement of lifecycle
  // =========================================================================
  test('Invalid State Transitions: rejected with appropriate conflict codes', async () => {
    // Cannot deliver an available donation: unassigned volunteer is rejected with 403 Forbidden
    const availableDonation = await createTestDonation();
    const deliverRes = await request(app)
      .patch(`/api/v1/donations/${availableDonation._id}/deliver`)
      .set('Authorization', `Bearer ${volunteerToken1}`);
    expect(deliverRes.status).toBe(403);
    expect(deliverRes.body.message).toMatch(/only mark donations assigned to you/i);

    // Cannot deliver an already delivered donation: assigned volunteer gets 409 Conflict
    const deliveredDonation = await createTestDonation({
      status: 'delivered',
      claimedBy: ngoUser1._id,
      volunteer: volunteerUser1._id,
      deliveredAt: new Date(),
    });
    const reDeliverRes = await request(app)
      .patch(`/api/v1/donations/${deliveredDonation._id}/deliver`)
      .set('Authorization', `Bearer ${volunteerToken1}`);
    expect(reDeliverRes.status).toBe(409);
    expect(reDeliverRes.body.message).toMatch(/already marked as delivered/i);

    // Cannot cancel an in_transit donation
    const inTransitDonation = await createTestDonation({
      status: 'in_transit',
      claimedBy: ngoUser1._id,
      volunteer: volunteerUser1._id,
      pickedUpAt: new Date(),
    });
    const cancelRes = await request(app)
      .delete(`/api/v1/donations/${inTransitDonation._id}`)
      .set('Authorization', `Bearer ${donorToken}`);
    expect(cancelRes.status).toBe(409);
    expect(cancelRes.body.message).toMatch(/Cannot cancel/i);

    // Cannot assign a volunteer to an already in_transit donation
    const assignRes = await request(app)
      .patch(`/api/v1/donations/${inTransitDonation._id}/assign-volunteer`)
      .set('Authorization', `Bearer ${ngoToken1}`)
      .send({ volunteerId: volunteerUser2._id.toString() });
    expect(assignRes.status).toBe(409);
  });

  // =========================================================================
  // 9. AUTHORIZATION & OWNERSHIP GUARDRAILS
  // =========================================================================
  test('Authorization Guardrails: unowned resources reject modifications with 403', async () => {
    // Donation claimed by ngoUser1
    const donation = await createTestDonation({
      status: 'claimed',
      claimedBy: ngoUser1._id,
      claimedAt: new Date(),
    });

    // ngoUser2 attempts to assign volunteer to ngoUser1's donation
    const assignRes = await request(app)
      .patch(`/api/v1/donations/${donation._id}/assign-volunteer`)
      .set('Authorization', `Bearer ${ngoToken2}`)
      .send({ volunteerId: volunteerUser1._id.toString() });
    expect(assignRes.status).toBe(403);
    expect(assignRes.body.message).toMatch(/only assign volunteers to your own/i);

    // Delivered donation claimed by ngoUser1
    const deliveredDonation = await createTestDonation({
      status: 'delivered',
      claimedBy: ngoUser1._id,
      volunteer: volunteerUser1._id,
      deliveredAt: new Date(),
    });

    // ngoUser2 attempts to rate volunteer on ngoUser1's donation
    const rateRes = await request(app)
      .patch(`/api/v1/donations/${deliveredDonation._id}/rate-volunteer`)
      .set('Authorization', `Bearer ${ngoToken2}`)
      .send({ rating: 5 });
    expect(rateRes.status).toBe(403);
  });

  // =========================================================================
  // 10. INPUT VALIDATION & ERROR SANITIZATION
  // =========================================================================
  test('Input Validation: malformed inputs return 400 Bad Request instead of 500', async () => {
    // Invalid ObjectId format
    const invalidIdRes = await request(app)
      .patch('/api/v1/donations/not-a-valid-id/claim')
      .set('Authorization', `Bearer ${ngoToken1}`);
    expect(invalidIdRes.status).toBe(400);
    expect(invalidIdRes.body.message).toMatch(/Invalid ID format/i);

    // Rating value out of range (< 1 or > 5)
    const donation = await createTestDonation({
      status: 'delivered',
      claimedBy: ngoUser1._id,
      volunteer: volunteerUser1._id,
      deliveredAt: new Date(),
    });
    const invalidRatingRes = await request(app)
      .patch(`/api/v1/donations/${donation._id}/rate-volunteer`)
      .set('Authorization', `Bearer ${ngoToken1}`)
      .send({ rating: 10 });
    expect(invalidRatingRes.status).toBe(400);
    expect(invalidRatingRes.body.message).toMatch(/Rating must be 1–5/i);
  });
});
