targets_test_profiles <- list(
  tar_target(test_profiles_root, "../utils/tests/files/parseProfilesFile"),
  tar_target(test_profiles_values, {
    set.seed(20220829)
    min_date <- ymd(20100101)
    n <- 2
    x <- tibble(
      date = ymd(c(20200801, 20210201)),
      n_values = 10 + floor(runif(n) * 10)
    ) %>%
      rowwise() %>%
      mutate(
        data = list({
          hour <- floor(runif(1, 0, 23))
          tibble(
            timestamp_utc = with_tz(force_tz(date + hours(hour) + minutes(seq(from = 0, by = 5, length.out = n_values)), "US/Alaska"), "UTC"),
            depth_m = c(0, sort(runif(n_values - 1, min = 0.01, max = 50))),
            temp_c = pmax(20 - sqrt(depth_m / 2), 0)
          )
        })
      ) %>%
      ungroup() %>%
      select(-n_values) %>%
      unnest(data)

    bind_rows(
      SITE_01 = x %>%
        mutate(
          temp_c = if_else(
            row_number() %in% 6:8,
            NA_real_,
            temp_c
          )
        ),
      SITE_02 = x %>%
        mutate(
          date = date + days(5),
          timestamp_utc = timestamp_utc + days(5),
          depth_m = depth_m + runif(n(), 0, 0.1),
          temp_c = temp_c + 0.5
        ),
      .id = "station_code"
    ) %>%
      arrange(station_code, date, depth_m) %>%
      mutate(
        datetime_utc_iso = str_c(format_ISO8601(timestamp_utc), "Z"),

        timestamp_tz = with_tz(timestamp_utc, "US/Alaska"),
        datetime_tz_iso = format(timestamp_tz, format = "%Y-%m-%dT%H:%M:%S%z"),
        datetime_tz_mdyhm = format(timestamp_tz, format = "%m/%d/%Y %H:%M"),
        timezone_int = parse_integer(format(timestamp_tz, format = "%z")) / 100,
        timezone_str = str_c("UTC", timezone_int),

        timestamp_akdt = timestamp_utc + hours(-8),
        datetime_akdt_mdyhm = format(timestamp_akdt, format = "%m/%d/%Y %H:%M"),
        timestamp_akst = timestamp_utc + hours(-9),
        datetime_akst_mdyhm = format(timestamp_akst, format = "%m/%d/%Y %H:%M"),

        temp_c = round(temp_c, 2),
        temp_f = 32 + temp_c * 9 / 5,
        depth_ft = depth_m / 0.3048
      ) %>%
      group_by(station_code, date) %>%
      mutate(
        timestamp_local = timestamp_utc + hours(first(timezone_int)),
        datetime_local_mdyhm = format(timestamp_local, format = "%m/%d/%Y %H:%M"),
        datetime_local_dmyhm = format(timestamp_local, format = "%d-%b-%Y %H:%M"),
        date_local_mdy = format(timestamp_local, format = "%m/%d/%Y"),
        time_local_hm = format(timestamp_local, format = "%H:%M")
      ) %>%
      ungroup()
  }),
  tar_target(test_profiles_values_plot, {
    test_profiles_values %>%
      ggplot(aes(temp_c, depth_m)) +
      geom_line() +
      geom_point() +
      scale_y_reverse() +
      facet_wrap(vars(station_code, date), labeller = label_both)
  }),

  tar_target(test_profiles, {
    x <- test_profiles_values %>%
      nest_by(station_code, date, .key = "values", .keep = TRUE) %>%
      mutate(
        station_id = parse_number(station_code),
        accuracy = NULL,
        reviewed = FALSE
      ) %>%
      ungroup() %>%
      relocate(values, .after = last_col())

    bind_rows(
      s1d1 = x %>%
        filter(station_code == "SITE_01", date == first(date)),
      s1d2 = x %>%
        filter(station_code == "SITE_01"),
      s2d2 = x,
      .id = "name"
    )
  }),
  tar_target(test_profiles_csv, {
    test_profiles %>%
      select(name, values) %>%
      unnest(values) %>%
      nest_by(name, .key = "values") %>%
      mutate(
        filename = list({
          filename <- file.path(test_profiles_root, glue("csv/profiles-{name}.csv"))
          values %>%
            select(-starts_with("timestamp")) %>%
            mutate(
              temp_c = if_else(!is.na(temp_c), sprintf("%.3f", temp_c), "-99.99"),
              temp_f = if_else(!is.na(temp_f), sprintf("%.3f", temp_f), "-99.99"),
            ) %>%
            write_csv(filename, na = "")
          filename
        })
      ) %>%
      pull(filename) %>%
      unlist()
  }, format = "file"),
  tar_target(test_profiles_json, {
    test_profiles %>%
      nest_by(name) %>%
      mutate(
        filename = list({
          filename <- file.path(test_profiles_root, glue("json/profiles-{name}.json"))

          data %>%
            mutate(
              date = as.character(date),
              values = map(values, function (x) {
                x %>%
                  filter(!is.na(temp_c)) %>%
                  transmute(
                    datetime = format(timestamp_utc, "%FT%T.000Z", tz = "UTC"),
                    value = temp_c,
                    depth_m = depth_m
                  )
              })
            ) %>%
            write_json(filename, auto_unbox = TRUE, pretty = TRUE, dataframe = "rows", na = "null")
          filename
        })
      ) %>%
      pull(filename) %>%
      unlist()
  }, format = "file"),
  tar_target(test_profiles_s1d1_csv, file.path(test_profiles_root, glue("csv/profiles-s1d1.csv")), format = "file"),
  tar_target(test_profiles_s1d1_skip_csv, {
    x <- read_csv(
      test_profiles_s1d1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_profiles_root, glue("csv/profiles-s1d1-skip.csv"))
    write_file(
      "# skip\n",
      file = filename
    )
    write.table(
      x,
      file = filename,
      sep = ",",
      append = TRUE,
      na = "",
      row.names = FALSE
    )
    filename
  }),
  tar_target(test_profiles_s1d1_depth_missing_csv, {
    x <- read_csv(
      test_profiles_s1d1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_profiles_root, glue("csv/profiles-s1d1-depth-missing.csv"))
    x %>%
      mutate(
        depth_m = if_else(row_number() == 5, NA_character_, depth_m)
      ) %>%
      select(station_code, datetime_utc_iso, depth_m, temp_c) %>%
      write_csv(filename, na = "")
    filename
  }),
  tar_target(test_profiles_s1d1_date_missing_csv, {
    x <- read_csv(
      test_profiles_s1d1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_profiles_root, glue("csv/profiles-s1d1-date-missing.csv"))
    x %>%
      mutate(
        datetime_utc_iso = if_else(row_number() == 5, NA_character_, datetime_utc_iso)
      ) %>%
      select(station_code, datetime_utc_iso, depth_m, temp_c) %>%
      write_csv(filename, na = "")
    filename
  }),
  tar_target(test_profiles_s1d1_date_future_csv, {
    x <- read_csv(
      test_profiles_s1d1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_profiles_root, glue("csv/profiles-s1d1-date-future.csv"))
    x %>%
      mutate(
        datetime_utc_iso = if_else(row_number() == 5, '2050-10-30T18:00:00Z', datetime_utc_iso)
      ) %>%
      select(station_code, datetime_utc_iso, depth_m, temp_c) %>%
      write_csv(filename, na = "")
    filename
  }),
  tar_target(test_profiles_s2d2_date, {
    test_profiles %>%
      filter(name == "s2d2") %>%
      rowwise() %>%
      mutate(
        values = list(
          values %>%
            select(station_code, date, depth_m, temp_c)
        )
      )
  }),
  tar_target(test_profiles_s2d2_date_json, {
    filename <- file.path(test_profiles_root, glue("json/profiles-s2d2-date.json"))
    test_profiles %>%
      filter(name == "s2d2") %>%
      mutate(
        date = as.character(date),
        values = map(values, function (x) {
          x %>%
            filter(!is.na(temp_c)) %>%
            transmute(
              datetime = format(force_tz(date, "US/Alaska"), "%FT%T.000Z", tz = "UTC"),
              value = temp_c,
              depth_m = depth_m
            )
        })
      ) %>%
      select(-name) %>%
      write_json(filename, auto_unbox = TRUE, pretty = TRUE, dataframe = "rows", na = "null")
    filename
  }, format = "file"),

  tar_target(test_profiles_config_default, {
    list(
      file_skip = "0",
      file_type = "PROFILES",
      station_code = "",
      station_column = "station_code",
      datetime_column = "datetime_utc_iso",
      time_column = "",
      datetime_format = "ISO",
      timezone = "UTC",
      timezone_column = "",
      temperature_column = "temp_c",
      temperature_units = "C",
      temperature_missing = "-99.99",
      depth_column = "depth_m",
      depth_units = "m",
      accuracy = "",
      reviewed = ""
    )
  }),
  tar_target(test_profiles_config_skip, {
    tibble(
      test_name = "s1d1-skip",
      expected = glue("profiles-s1d1.json"),
      filename = glue("profiles-s1d1-skip.csv"),
      config = list(as_tibble(modifyList(test_profiles_config_default, list(file_skip = "1", station_code = "SITE_01", station_column = ""))))
    ) %>%
      unnest(config)
  }),
  tar_target(test_profiles_config_date, {
    tibble(
      test_name = "s2d2-date",
      expected = glue("profiles-s2d2-date.json"),
      filename = glue("profiles-s2d2.csv"),
      config = list(as_tibble(modifyList(
        test_profiles_config_default,
        list(
          datetime_column = "date_local_mdy",
          time_column = "",
          datetime_format = "M/d/yy",
          timezone = "LOCAL",
          timezone_column = ""
        )
      )))
    ) %>%
      unnest(config)
  }),
  tar_target(test_profiles_config_minimal, {
    test_profiles %>%
      distinct(name) %>%
      rename(test_name = name) %>%
      rowwise() %>%
      mutate(
        expected = glue("profiles-{test_name}.json"),
        filename = glue("profiles-{test_name}.csv"),
        config = list(as_tibble(test_profiles_config_default))
      ) %>%
      unnest(config) %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      )
  }),
  tar_target(test_profiles_config_timestamp, {
    list(
      datetime_utc_iso = list(
        datetime_column = "datetime_utc_iso",
        datetime_format = "ISO",
        timezone = "UTC"
      ),
      datetime_tz_iso = list(
        datetime_column = "datetime_tz_iso",
        datetime_format = "ISO",
        timezone = "UTC"
      ),

      datetime_tz_mdyhm_col_int = list(
        datetime_column = "datetime_tz_mdyhm",
        datetime_format = "M/d/yy H:mm",
        timezone = "COLUMN",
        timezone_column = "timezone_int"
      ),
      datetime_tz_mdyhm_col_str = list(
        datetime_column = "datetime_tz_mdyhm",
        datetime_format = "M/d/yy H:mm",
        timezone = "COLUMN",
        timezone_column = "timezone_str"
      ),

      datetime_local_mdyhm_local = list(
        datetime_column = "datetime_local_mdyhm",
        datetime_format = "M/d/yy H:mm",
        timezone = "LOCAL"
      ),
      datetime_local_dmyhm_local = list(
        datetime_column = "datetime_local_dmyhm",
        datetime_format = "d-MMM-yy H:mm",
        timezone = "LOCAL"
      ),
      date_time_local_mdyhm_local = list(
        datetime_column = "date_local_mdy",
        time_column = "time_local_hm",
        datetime_format = "M/d/yy H:mm",
        timezone = "LOCAL"
      ),

      datetime_akdt_mdyhm_utc8 = list(
        datetime_column = "datetime_akdt_mdyhm",
        datetime_format = "M/d/yy H:mm",
        timezone = "UTC-8"
      ),
      datetime_akst_mdyhm_utc9 = list(
        datetime_column = "datetime_akst_mdyhm",
        datetime_format = "M/d/yy H:mm",
        timezone = "UTC-9"
      )
    ) %>%
      enframe(name = "test_name") %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      ) %>%
      crossing(test_file = unique(test_profiles$name)) %>%
      rowwise() %>%
      mutate(test_name = glue("{test_file}:{test_name}")) %>%
      mutate(
        filename = glue("profiles-{test_file}.csv"),
        expected = glue("profiles-{test_file}.json"),
        config = list(as_tibble(modifyList(test_profiles_config_default, value)))
      ) %>%
      select(-value, -test_file) %>%
      unnest(config) %>%
      ungroup()
  }),
  tar_target(test_profiles_config_stations, {
    list(
      stations_code = list(
        filename = "profiles-s1d2.csv",
        expected = "profiles-s1d2.json",
        station_code = "SITE_01",
        station_column = ""
      ),
      stations_column = list(
        filename = "profiles-s1d2.csv",
        expected = "profiles-s1d2.json",
        station_column = "station_code"
      )
    ) %>%
      enframe(name = "test_name") %>%
      rowwise() %>%
      mutate(
        config = list(as_tibble(modifyList(test_profiles_config_default, value)))
      ) %>%
      select(-value) %>%
      unnest(config) %>%
      ungroup() %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      )
  }),
  tar_target(test_profiles_config_temperature, {
    list(
      units_c = list(
        temperature_column = "temp_c",
        temperature_units = "C"
      ),
      units_f = list(
        temperature_column = "temp_f",
        temperature_units = "F"
      )
    ) %>%
      enframe(name = "test_name") %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      ) %>%
      crossing(test_file = unique(test_profiles$name)) %>%
      rowwise() %>%
      mutate(test_name = glue("{test_file}:{test_name}")) %>%
      mutate(
        filename = glue("profiles-{test_file}.csv"),
        expected = glue("profiles-{test_file}.json"),
        config = list(as_tibble(modifyList(test_profiles_config_default, value)))
      ) %>%
      select(-value, -test_file) %>%
      unnest(config) %>%
      ungroup()
  }),
  tar_target(test_profiles_config_depth, {
    list(
      depth_column_m = list(
        filename = "profiles-s2d2.csv",
        expected = "profiles-s2d2.json",
        depth_column = "depth_m",
        depth_units = "m"
      ),
      depth_column_ft = list(
        filename = "profiles-s2d2.csv",
        expected = "profiles-s2d2.json",
        depth_column = "depth_ft",
        depth_units = "ft"
      )
    ) %>%
      enframe(name = "test_name") %>%
      rowwise() %>%
      mutate(
        config = list(as_tibble(modifyList(test_profiles_config_default, value)))
      ) %>%
      select(-value) %>%
      unnest(config) %>%
      ungroup() %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      )
  }),

  tar_target(test_profiles_config, {
    bind_rows(
      skip = test_profiles_config_skip,
      date = test_profiles_config_date,
      minimal = test_profiles_config_minimal,
      timestamp = test_profiles_config_timestamp,
      stations = test_profiles_config_stations,
      temperature = test_profiles_config_temperature,
      depth = test_profiles_config_depth,
      .id = "test_group"
    )
  }),
  tar_target(test_profiles_config_csv, {
    filename <- file.path(test_profiles_root, "config.csv")
    test_profiles_config %>%
      write_csv(filename, na = "")
    filename
  }, format = "file"),

  tar_target(test_profiles_s2d2_csv, file.path(test_profiles_root, "csv/profiles-s2d2.csv"), format = "file"),
  tar_target(test_profiles_cli_csv, {
    from <- test_profiles_s2d2_csv
    to <- file.path("../cli/tests/files/profiles/csv/profiles.csv")
    file.copy(from, to)
    to
  }, format = "file"),
  tar_target(test_profiles_s2d2_json, file.path(test_profiles_root, "json/profiles-s2d2.json"), format = "file"),
  tar_target(test_profiles_cli_json, {
    from <- test_profiles_s2d2_json
    to <- file.path("../cli/tests/files/profiles/json/profiles.json")
    file.copy(from, to)
    to
  }, format = "file"),
  tar_target(test_profiles_cli_config_csv, {
    filename <- "../cli/tests/files/profiles/config.csv"
    test_profiles_config_minimal %>%
      filter(test_name == "3_s2d2") %>%
      select(-test_name, -expected) %>%
      mutate(filename = "profiles.csv") %>%
      write_csv(filename, na = "")
    filename
  }, format = "file")
)