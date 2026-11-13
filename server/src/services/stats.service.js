/**
 * ==============================================================================
 * SHAREBITE - IMPACT STATISTICS & ENVIRONMENTAL ANALYTICS SERVICE
 * ==============================================================================
 * Member 4 - Smart Features & Integration
 * 
 * Computes social impact metrics (meals rescued, people fed) and environmental
 * savings (CO2e avoided, water conserved, landfill methane prevented)
 * using EPA / FAO waste diversion factors.
 * ==============================================================================
 */

// Waste-to-impact conversion constants (based on EPA WARM & FAO Food Wastage Footprint models)
const CO2E_PER_KG_FOOD = 2.5;         // 2.5 kg CO2-equivalent avoided per 1 kg food waste diverted
const WATER_LITERS_PER_KG_FOOD = 800; // 800 liters of embedded water footprint per 1 kg food
const METHANE_KG_PER_KG_FOOD = 0.08;  // 0.08 kg of CH4 landfill emission prevented per 1 kg
const MEAL_AVG_WEIGHT_KG = 0.42;      // Standard meal portion ~ 420 grams
const ESTIMATED_MEAL_VALUE_USD = 3.50;// Average economic cost saved per meal portion ($3.50)

export const statsService = {
  /**
   * Get high-level platform operational overview
   * @returns {Promise<Object>}
   */
  async getOverviewStats() {
    const totalMealsSaved = 1480;
    const totalKgFoodSaved = Math.round(totalMealsSaved * MEAL_AVG_WEIGHT_KG * 10) / 10;
    const co2EmissionsAvoidedKg = Math.round(totalKgFoodSaved * CO2E_PER_KG_FOOD * 10) / 10;

    return {
      totalDonations: 164,
      activeDonations: 32,
      totalRequests: 112,
      completedDistributions: 98,
      totalMealsSaved,
      totalKgFoodSaved,
      co2EmissionsAvoidedKg,
      activeDonorsCount: 38,
      registeredReceiversCount: 52,
      averagePickupTimeMinutes: 48,
      successRatePercentage: 92.4
    };
  },

  /**
   * Calculate detailed environmental and social impact metrics
   * Includes real-world equivalency benchmarks (cars taken off road, water usage)
   * 
   * @param {Object} [options]
   * @param {number} [options.mealsSaved] Optional override for custom calculation
   * @returns {Promise<Object>} Impact report
   */
  async getImpactMetrics(options = {}) {
    const mealsSaved = options.mealsSaved || 1480;
    const totalKgFoodSaved = Math.round(mealsSaved * MEAL_AVG_WEIGHT_KG * 100) / 100;
    const co2EmissionsAvoidedKg = Math.round(totalKgFoodSaved * CO2E_PER_KG_FOOD * 100) / 100;
    const waterSavedLiters = Math.round(totalKgFoodSaved * WATER_LITERS_PER_KG_FOOD);
    const methanePreventedKg = Math.round(totalKgFoodSaved * METHANE_KG_PER_KG_FOOD * 100) / 100;
    const economicValueSavedUSD = Math.round(mealsSaved * ESTIMATED_MEAL_VALUE_USD);

    // Equivalency calculations:
    // 1 passenger car emits ~0.192 kg CO2 per km (~12 km per kg CO2)
    const carKilometersAvoided = Math.round(co2EmissionsAvoidedKg * 5.2);
    // Average urban person uses ~150 liters of domestic water per day
    const personDaysOfWaterSaved = Math.round(waterSavedLiters / 150);
    // 1 tree seedling grown for 10 years sequesters ~60 kg CO2
    const treeSeedlings10YrEquiv = Math.round((co2EmissionsAvoidedKg / 60) * 10) / 10;

    return {
      coreMetrics: {
        totalMealsRescued: mealsSaved,
        totalKgFoodDiverted: totalKgFoodSaved,
        co2EmissionsAvoidedKg,
        waterSavedLiters,
        methanePreventedKg,
        economicValueSavedUSD
      },
      environmentalEquivalents: {
        carKilometersAvoided: {
          value: carKilometersAvoided,
          description: `Equivalent to taking a passenger car off the road for ${carKilometersAvoided.toLocaleString()} kilometers.`
        },
        householdWaterDays: {
          value: personDaysOfWaterSaved,
          description: `Conserved enough water to supply an individual for ${personDaysOfWaterSaved.toLocaleString()} days.`
        },
        treeSeedlingsEquivalent: {
          value: treeSeedlings10YrEquiv,
          description: `Carbon offset equivalent to planting ${treeSeedlings10YrEquiv} tree seedlings grown for 10 years.`
        }
      },
      calculationMethodology: {
        source: 'EPA Waste Reduction Model (WARM) & FAO Food Wastage Footprint',
        factors: {
          co2ePerKg: `${CO2E_PER_KG_FOOD} kg CO2e / kg food`,
          waterPerKg: `${WATER_LITERS_PER_KG_FOOD} liters / kg food`,
          methanePerKg: `${METHANE_KG_PER_KG_FOOD} kg CH4 / kg food`
        }
      },
      generatedAt: new Date().toISOString()
    };
  },

  /**
   * Get category-wise breakdown of food waste diversion
   * @returns {Promise<Array>}
   */
  async getCategoryBreakdown() {
    return [
      {
        category: 'Cooked Meals',
        mealsRescued: 710,
        kgSaved: 298.2,
        percentage: 48.0,
        co2AvoidedKg: 745.5
      },
      {
        category: 'Produce',
        mealsRescued: 345,
        kgSaved: 144.9,
        percentage: 23.3,
        co2AvoidedKg: 362.25
      },
      {
        category: 'Bakery',
        mealsRescued: 230,
        kgSaved: 96.6,
        percentage: 15.5,
        co2AvoidedKg: 241.5
      },
      {
        category: 'Dairy',
        mealsRescued: 115,
        kgSaved: 48.3,
        percentage: 7.8,
        co2AvoidedKg: 120.75
      },
      {
        category: 'Packaged Goods',
        mealsRescued: 80,
        kgSaved: 33.6,
        percentage: 5.4,
        co2AvoidedKg: 84.0
      }
    ];
  },

  /**
   * Top community contributors & recipient impact leaderboard
   * @returns {Promise<Object>}
   */
  async getLeaderboard() {
    return {
      topDonors: [
        { name: 'Metro Community Kitchen', mealsRescued: 460, co2SavedKg: 483.0, badge: 'Gold Food Guardian' },
        { name: 'Downtown Bakery & Deli', mealsRescued: 320, co2SavedKg: 336.0, badge: 'Silver Food Guardian' },
        { name: 'Fresh Greens Wholesale', mealsRescued: 280, co2SavedKg: 294.0, badge: 'Bronze Food Guardian' }
      ],
      topRecipientNGOs: [
        { name: 'Hope Community Shelter', mealsReceived: 540, individualsFed: 310 },
        { name: 'City Care Food Pantry', mealsReceived: 420, individualsFed: 240 },
        { name: 'Grace Orphanage & Youth', mealsReceived: 310, individualsFed: 120 }
      ]
    };
  }
};

export default statsService;
