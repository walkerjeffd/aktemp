targets_gis <- list(
  tar_target(gis_dir, {
    dotenv::load_dot_env()
    Sys.getenv("AKTEMP_GIS_DIR")
  }, cue = tar_cue("always")),
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
  }),
  tar_target(gis_wbd, {
    filepath <- file.path(gis_dir, "WBD_19_HU2_GDB", "WBD_19_HU2_GDB.gdb")
    huc4 <- st_read(filepath, layer = "WBDHU4") %>%
      st_transform("EPSG:4326")
    huc6 <- st_read(filepath, layer = "WBDHU6") %>%
      st_transform("EPSG:4326")
    huc8 <- st_read(filepath, layer = "WBDHU8") %>%
      st_transform("EPSG:4326")
    mapview::mapview(huc4)
    list(huc4 = huc4, huc6 = huc6, huc8 = huc8)
  }),
  tar_target(gis_wbd_huc4_geojson, {
    filepath <- file.path("../app/public/static/gis/wbd_huc4.geojson")
    if (file.exists(filepath)) {
      unlink(filepath)
    }
    gis_wbd$huc4 %>%
      st_simplify(dTolerance = 100) %>%
      st_write(filepath, layer_options = c(
        "COORDINATE_PRECISION=6",
        "ID_FIELD=huc4"
      ), append=FALSE)
    filepath
  }, format = "file"),
  tar_target(gis_wbd_huc6_geojson, {
    filepath <- file.path("../app/public/static/gis/wbd_huc6.geojson")
    if (file.exists(filepath)) {
      unlink(filepath)
    }
    gis_wbd$huc6 %>%
      st_simplify(dTolerance = 100) %>%
      st_write(filepath, layer_options = c(
        "COORDINATE_PRECISION=6",
        "ID_FIELD=huc6"
      ), append=FALSE)
    filepath
  }, format = "file"),
  tar_target(gis_wbd_huc8_geojson, {
    filepath <- file.path("../app/public/static/gis/wbd_huc8.geojson")
    if (file.exists(filepath)) {
      unlink(filepath)
    }
    gis_wbd$huc8 %>%
      st_simplify(dTolerance = 100) %>%
      st_write(filepath, layer_options = c(
        "COORDINATE_PRECISION=6",
        "ID_FIELD=huc8"
      ), append=FALSE)
    filepath
  }, format = "file")
)