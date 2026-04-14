export const PLAN_LIMITS = {
  free: {
    maxEmployees:    1,
    maxBookingsMonth: 30,
    calendarWeekly:  false,
    multiLocation:   false,
  },
  starter: {
    maxEmployees:    3,
    maxBookingsMonth: Infinity,
    calendarWeekly:  true,
    multiLocation:   false,
  },
  pro: {
    maxEmployees:    10,
    maxBookingsMonth: Infinity,
    calendarWeekly:  true,
    multiLocation:   false,
  },
  business: {
    maxEmployees:    Infinity,
    maxBookingsMonth: Infinity,
    calendarWeekly:  true,
    multiLocation:   true,
  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS['free'];
}

export function canAddEmployee(plan, currentCount) {
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxEmployees;
}

export function canAddBooking(plan, bookingsThisMonth) {
  const limits = getPlanLimits(plan);
  return bookingsThisMonth < limits.maxBookingsMonth;
}

export const PLAN_NAMES = {
  free:     'Free',
  starter:  'Starter',
  pro:      'Pro',
  business: 'Business',
};

export const PLAN_PRICES = {
  free:     0,
  starter:  15,
  pro:      45,
  business: 99,
};