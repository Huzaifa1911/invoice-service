export function getPaginationParams(page = 1, limit = 10) {
  const take = Math.max(limit, 1);
  const skip = (Math.max(page, 1) - 1) * take;
  return { skip, take };
}
