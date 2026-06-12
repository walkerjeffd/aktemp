// Number of values fetched per request when paging through a series.
// Each value is small (datetime + temp_c), so a large page keeps the
// number of round-trips low while bounding individual response sizes.
export const SERIES_VALUES_PAGE_SIZE = 50000

// Fetch ALL values for a series by paging through the public
// `/series/:id/values` endpoint until a short (final) page is returned.
// `http` is an axios instance (e.g. this.$http.public). `start`/`end` are
// optional ISO datetime strings forwarded as range filters.
export async function fetchSeriesValues (http, seriesId, { start, end, pageSize = SERIES_VALUES_PAGE_SIZE } = {}) {
  const params = {}
  if (start) params.start = start
  if (end) params.end = end

  const all = []
  let page
  let offset = 0
  do {
    page = await http
      .get(`/series/${seriesId}/values`, { params: { ...params, limit: pageSize, offset } })
      .then(d => d.data)
    all.push(...page)
    offset += pageSize
  } while (page.length === pageSize)
  return all
}
