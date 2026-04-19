export const PLAN_LIMITS = {
  free: {
    maxEmployees:    1,
    maxServices:     3,
    maxBookingsMonth: 10,
    calendarWeekly:  false,
    dashboard:       false,
    sms:             false,
    dragDrop:        false,
    stats:           false,
  },
  starter: {
    maxEmployees:    3,
    maxServices:     10,
    maxBookingsMonth: Infinity,
    calendarWeekly:  true,
    dashboard:       true,
    sms:             true,
    dragDrop:        false,
    stats:           false,
  },
  pro: {
    maxEmployees:    10,
    maxServices:     Infinity,
    maxBookingsMonth: Infinity,
    calendarWeekly:  true,
    dashboard:       true,
    sms:             true,
    dragDrop:        true,
    stats:           true,
  },
  business: {
    maxEmployees:    Infinity,
    maxServices:     Infinity,
    maxBookingsMonth: Infinity,
    calendarWeekly:  true,
    dashboard:       true,
    sms:             true,
    dragDrop:        true,
    stats:           true,
  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS['free'];
}

export function canAddEmployee(plan, currentCount) {
  return currentCount < getPlanLimits(plan).maxEmployees;
}

export function canAddService(plan, currentCount) {
  return currentCount < getPlanLimits(plan).maxServices;
}

export function canAddBooking(plan, bookingsThisMonth) {
  return bookingsThisMonth < getPlanLimits(plan).maxBookingsMonth;
}

export function hasCalendar(plan) {
  return getPlanLimits(plan).calendarWeekly;
}

export function hasDashboard(plan) {
  return getPlanLimits(plan).dashboard;
}

export function hasSMS(plan) {
  return getPlanLimits(plan).sms;
}

export function hasDragDrop(plan) {
  return getPlanLimits(plan).dragDrop;
}

export function hasStats(plan) {
  return getPlanLimits(plan).stats;
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