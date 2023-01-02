tar_option_set(packages = c("tidyverse", "lubridate", "sf", "janitor", "glue", "jsonlite"))

dir.create("export/demo/series", recursive = TRUE, showWarnings = FALSE)
dir.create("export/demo/profiles", recursive = TRUE, showWarnings = FALSE)
dir.create("export/demo/stations", recursive = TRUE, showWarnings = FALSE)

targets_demo <- list(
  tar_target(demo_profiles_n, 1000),
  tar_target(demo_profiles, {
    set.seed(20220829)
    min_date <- ymd(20100101)
    tibble(
      id = 1:demo_profiles_n,
      n_values = 10 + floor(runif(demo_profiles_n) * 10)
    ) %>%
      rowwise() %>%
      mutate(
        data = list({
          date <- min_date + days(floor(runif(1, 0, 365 * 10)))
          hour <- floor(runif(1, 0, 23))
          tibble(
            datetime = date + hours(hour) + minutes(seq(from = 0, by = 5, length.out = n_values)),
            date = as_date(min(datetime)),
            time = format(datetime, "%H:%M"),
            depth_m = sort(runif(n_values, min = 0, max = 50)),
            temp_c = pmax(15 - runif(n = 1, min = 0.1, max = 3) * sqrt(depth_m), 0)
          )
        })
      ) %>%
      ungroup() %>%
      select(-n_values)
  }),
  tar_target(demo_profiles_plot, {
    demo_profiles %>%
      sample_n(size = 12) %>%
      unnest(data) %>%
      mutate(date = as_date(datetime)) %>%
      ggplot(aes(temp_c, depth_m)) +
      geom_line() +
      geom_point() +
      scale_y_reverse() +
      facet_wrap(vars(id, date))
  }),
  tar_target(demo_profiles_file, {
    filename <- "../utils/tests/files/parseProfilesFile/profiles.csv"
    demo_profiles %>%
      head(10) %>%
      # select(-id) %>%
      mutate(station_code = if_else(id <= 5, "SITE_01", "SITE_02")) %>%
      unnest(data) %>%
      mutate(
        date_local = format(date, "%m/%d/%Y"), .before = "date"
      ) %>%
      write_csv(filename, na = "")
    filename
  }, format = "file"),
  tar_target(demo_profiles_sizes_files, {
    set.seed(20221020)
    tibble(
      n = c(1, 10, 100, 1000)
    ) %>%
      rowwise() %>%
      mutate(
        data = list({
          demo_profiles %>%
            sample_n(size = n) %>%
            unnest(data) %>%
            arrange(id, depth_m)
        }),
        filename = {
          filename <- glue("export/demo/profiles/profiles-{n}.csv")
          data %>%
            write_csv(filename)
          as.character(filename)
        }
      ) %>%
      pull(filename)
  }, format = "file"),

  tar_target(demo_stations_n, 1e4),
  tar_target(demo_stations, {
    tibble(
      latitude = runif(demo_stations_n * 10, min = gis_bbox$ymin, max = gis_bbox$ymax),
      longitude = runif(demo_stations_n * 10, min = gis_bbox$xmin, max = gis_bbox$xmax)
    ) %>%
      st_as_sf(coords = c("longitude", "latitude"), crs = st_crs(4326), remove = FALSE) %>%
      st_filter(gis_state) %>%
      head(demo_stations_n) %>%
      mutate(
        id = row_number(),
        code = glue("SITE_{sprintf('%05d', id)}"),
        timezone = if_else(longitude < -170, "US/Aleutian", "US/Alaska"),
        description = if_else(
          runif(n()) < 0.5,
          map_chr(1:n(), ~ paste0(sample(letters, size = floor(runif(1, 0, 50)), replace = TRUE), collapse = "")),
          NULL
        ),
        waterbody_name = if_else(
          runif(n()) < 0.5,
          map_chr(1:n(), ~ paste0(sample(letters, size = floor(runif(1, 0, 20)), replace = TRUE), collapse = "")),
          NULL
        ),
        waterbody_type = if_else(
          runif(n()) < 0.5,
          sample(c("STREAM", "LAKE", NULL), size = n(), replace = TRUE),
          NULL
        ),
        placement = if_else(
          runif(n()) < 0.5,
          sample(c("MAIN", "SIDE", NULL), size = n(), replace = TRUE),
          NULL
        ),
        mixed = if_else(
          runif(n()) < 0.5,
          sample(c(TRUE, FALSE), size = n(), replace = TRUE),
          NULL
        ),
        active = if_else(
          runif(n()) < 0.5,
          sample(c(TRUE, FALSE), size = n(), replace = TRUE),
          NULL
        ),
        reference = if_else(
          runif(n()) < 0.5,
          map_chr(1:n(), ~ paste0(sample(letters, size = floor(runif(1, 0, 50)), replace = TRUE), collapse = "")),
          NULL
        ),
        private = if_else(
          runif(n()) < 0.8,
          sample(c(TRUE, FALSE), size = n(), replace = TRUE, prob = c(0.1, 0.9)),
          NULL
        )
      )
  }),
  tar_target(demo_stations_plot, {
    demo_stations %>%
      sample_frac(size = 0.1) %>%
      ggplot() +
      geom_sf(data = gis_state) +
      geom_sf(aes(color = waterbody_type), size = 0.5, alpha = 0.5)
  }),
  tar_target(demo_stations_files, {
    tibble(
      n = c(1, 10, 100, 1000)
    ) %>%
      rowwise() %>%
      mutate(
        data = list({
          demo_stations %>%
            select(-id) %>%
            relocate(code, .before = everything()) %>%
            sample_n(size = n) %>%
            st_drop_geometry()
        }),
        filename = {
          filename <- glue("export/demo/stations/stations-{n}.csv")
          data %>%
            write_csv(filename, na = "")
          as.character(filename)
        }
      ) %>%
      pull(filename)
  }),
  tar_target(demo_stations_mock_files, {
    dir.create("export/demo/stations/mock", recursive = TRUE, showWarnings = FALSE)
    x <- demo_stations %>%
      mutate(
        provider_code = sample(c("USGS", "NPS", "UAA"), size = n(), replace = TRUE)
      )

    tibble(
      n = c(100, 1000, 5000, 10000)
    ) %>%
      rowwise() %>%
      mutate(
        data = list({
          x %>%
            sample_n(size = n) %>%
            st_drop_geometry()
        }),
        filename = {
          filename <- glue("export/demo/stations/mock/stations-{n}.json")
          data %>%
            write_json(filename)
          as.character(filename)
        }
      ) %>%
      pull(filename)
  }, format = "file"),

  tar_target(demo_series, {
    uaa_data$values %>%
      filter(station_code == "Little Su 1", logger_sn == 20431757) %>%
      transmute(
        timestamp_utc = datetime,
        timestamp_local = with_tz(datetime, "US/Alaska"),
        station_one = "SITE_01",
        station_two = if_else(year(timestamp_local) == 2020, "SITE_01", "SITE_02"),
        datetime_iso_z = str_c(format_ISO8601(timestamp_utc), "Z"),
        datetime_iso_local = format(timestamp_local, format = "%Y-%m-%dT%H:%M:%S%z"),
        datetime_local = format(timestamp_local, format = "%m/%d/%Y %H:%M"),
        datetime_local_excel = format(timestamp_local, format = "%d-%b-%Y %H:%M"),
        date_local = format(timestamp_local, format = "%m/%d/%Y"),
        time_local = format(timestamp_local, format = "%H:%M"),
        timezone = parse_integer(format(timestamp_local, format = "%z")) / 100,
        timezone_tz = str_c("UTC", parse_integer(format(timestamp_local, format = "%z")) / 100),
        temp_c = round(temp_c, 2),
        temp_f = 32 + temp_c * 9 / 5,
        temp_c_missing = case_when(
          datetime_iso_z == "2020-09-26T10:00:00Z" ~ "-99",
          datetime_iso_z == "2020-09-26T12:00:00Z" ~ "NA",
          TRUE ~ as.character(temp_c)
        ),
        flag_none = NA_character_,
        flag_all = "X",
        flag_one = if_else(date_local == "09/26/2020", "X", NA_character_),
        flag_two = if_else(date_local %in% c("09/26/2020", "09/28/2020"), "X", NA_character_),
        depth_m = if_else(year(timestamp_local) == 2020, 0, 1)
      ) %>%
      arrange(timestamp_utc)
  }),
  tar_target(demo_series_file, {
    filename <- "../utils/tests/files/parseSeriesFile/series.csv"
    demo_series %>%
      select(-starts_with("timestamp_")) %>%
      write_csv(filename, na = "")
    filename
  }, format = "file")
)