export const paginationResponse = ({ data, total, page, limit }) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
});
