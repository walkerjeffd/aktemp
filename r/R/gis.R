targets_gis <- list(
  tar_target(gis_bbox, {
    st_bbox(c(xmin = -180, xmax = -125, ymin = 45, ymax = 75), crs = st_crs(4326))
  }),
  tar_target(gis_state, {
    USAboundaries::us_states(states = "AK") %>%
      st_crop(gis_bbox)
  }),
  tar_target(gis_state_plot, {
    gis_state %>%
      ggplot() +
      geom_sf()
  })
)