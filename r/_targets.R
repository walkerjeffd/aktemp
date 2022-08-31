library(targets)

invisible(sapply(list.files("R", pattern = ".R$", full.names = TRUE), source))

options(tidyverse.quiet = TRUE)
tar_option_set(packages = c("tidyverse", "lubridate", "janitor", "glue", "jsonlite"))

# load packages into session
if (interactive()) {
  sapply(tar_option_get("packages"), require, character.only = TRUE)
}

dir.create("export/test/files", recursive = TRUE, showWarnings = FALSE)
dir.create("export/nps/files", recursive = TRUE, showWarnings = FALSE)
dir.create("export/uaa/files", recursive = TRUE, showWarnings = FALSE)

list(
  # test --------------------------------------------------------------------
  tar_target(test_profiles, {
    set.seed(20220829)
    tibble(
      id = 1:5,
      n_values = 10 + floor(runif(5) * 10)
    ) %>%
      rowwise() %>%
      mutate(
        data = list({
          tibble(
            datetime = ymd(20220701) + days(id * 2) + hours(12 + id) + minutes(seq(from = 0, by = 5, length.out = n_values)),
            depth_m = 0:(n_values - 1),
            temp_c = 15 - runif(n = 1, min = 0.1, max = 3) * sqrt(depth_m)
          )
        })
      ) %>%
      unnest(data) %>%
      select(-n_values)
  }),
  tar_target(test_profiles_plot, {
    test_profiles %>%
      mutate(date = as_date(datetime)) %>%
      ggplot(aes(temp_c, depth_m)) +
      geom_line() +
      geom_point() +
      scale_y_reverse() +
      facet_wrap(vars(id, date))
  }),
  tar_target(test_profiles_file, {
    filename <- "export/test/files/profiles.csv"
    test_profiles %>%
      write_csv(filename)
    filename
  }, format = "file"),

  # nps ----------------------------------------------------------------
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
  tar_target(nps_values_files, export_nps_values(nps_root, nps_data), format = "file"),

  # uaa ----------------------------------------------------------------
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
  tar_target(uaa_organization_file, {
    filename <- file.path(uaa_root, "stations.csv")
    uaa_data$stations %>%
      rename(code = station_code) %>%
      mutate(timezone = "US/Alaska") %>%
      write_csv(filename)
    filename
  }, format = "file"),
  tar_target(uaa_stations_file, {
    filename <- file.path(uaa_root, "organization.csv")
    tibble(
      id = "UAA",
      name = "Univ Alaska, Anchorage"
    ) %>%
      write_csv(filename)
    filename
  }, format = "file"),
  tar_target(uaa_values_files, export_uaa_values(uaa_root, uaa_data), format = "file")
)
