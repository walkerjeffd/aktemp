dir.create("export/uaa/files", recursive = TRUE, showWarnings = FALSE)

targets_uaa <- list(
  tar_target(uaa_root, "export/uaa"),
  tar_target(uaa_file, "data/littleSu_data_for_jeff.csv", format = "file"),
  tar_target(uaa_data, read_uaa_file(uaa_file)),
  tar_target(uaa_station_summary, {
    uaa_data$values %>%
      group_by(station_code) %>%
      summarise(
        n = n(),
        start = min(as_date(datetime)),
        end = max(as_date(datetime))
      )
  }),
  tar_target(uaa_daily_data, {
    uaa_data$values %>%
      group_by(station_code, date = as_date(datetime)) %>%
      summarise(temp_c = mean(temp_c), .groups = "drop")
  }),
  tar_target(uaa_daily_plot, {
    uaa_daily_data %>%
      ggplot(aes(date, temp_c)) +
      geom_line() +
      facet_wrap(vars(station_code), scales = "free")
  }),
  tar_target(uaa_config_file, {
    filename <- file.path(uaa_root, "config.json")
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
  tar_target(uaa_provider_file, {
    filename <- file.path(uaa_root, "stations.csv")
    uaa_data$stations %>%
      rename(code = station_code) %>%
      mutate(timezone = "US/Alaska") %>%
      write_csv(filename)
    filename
  }, format = "file"),
  tar_target(uaa_stations_file, {
    filename <- file.path(uaa_root, "provider.csv")
    tibble(
      id = "UAA",
      name = "Univ Alaska, Anchorage"
    ) %>%
      write_csv(filename)
    filename
  }, format = "file"),
  tar_target(uaa_values_files, export_uaa_values(uaa_root, uaa_data), format = "file")
)