dir.create("export/nps/files", recursive = TRUE, showWarnings = FALSE)

targets_nps <- list(
  tar_target(nps_root, "export/nps"),
  tar_target(nps_file, "data/lake_data_for_JeffW.csv", format = "file"),
  tar_target(nps_data, read_nps_file(nps_file)),
  tar_target(nps_station_summary, {
    nps_data$values %>%
      group_by(station_code) %>%
      summarise(
        n = n(),
        min_depth_m = min(depth_m),
        max_depth_m = max(depth_m),
        start = min(as_date(datetime)),
        end = max(as_date(datetime))
      )
  }),
  tar_target(nps_daily_data, {
    nps_data$values %>%
      group_by(station_code, depth_m, date = as_date(datetime)) %>%
      summarise(temp_c = mean(temp_c), .groups = "drop")
  }),
  tar_target(nps_daily_plot, {
    nps_daily_data %>%
      ggplot(aes(date, depth_m)) +
      geom_tile(aes(fill = temp_c)) +
      scale_fill_viridis_c() +
      scale_y_reverse() +
      facet_wrap(vars(station_code), scales = "free")
  }),
  tar_target(nps_config_file, {
    filename <- file.path(nps_root, "config.json")
    list(
      timestamp = list(
        column = "datetime"
      ),
      temperature = list(
        column = "temp_c"
      )
    ) %>%
      write_json(filename, pretty = TRUE, auto_unbox = TRUE)
    filename
  }, format = "file"),
  tar_target(nps_organization_file, {
    filename <- file.path(nps_root, "organization.csv")
    tibble(
      id = "NPS",
      name = "National Park Service"
    ) %>%
      write_csv(filename)
    filename
  }, format = "file"),
  tar_target(nps_stations_file, {
    filename <- file.path(nps_root, "stations.csv")
    nps_data$stations %>%
      rename(code = station_code) %>%
      mutate(timezone = "US/Alaska") %>%
      write_csv(filename)
    filename
  }, format = "file"),
  tar_target(nps_values_files, export_nps_values(nps_root, nps_data), format = "file")
)