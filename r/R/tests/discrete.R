targets_test_discrete <- list(
  tar_target(test_discrete_root, "../utils/tests/files/parseSeriesFile"),
  tar_target(test_discrete_flags, {
    tribble(
      ~station_code, ~start_datetime,       ~end_datetime,          ~flag,
      "SITE_01",     "2021-07-04T21:00:00Z","2021-07-18T21:00:00Z", "X"
    ) %>%
      mutate(
        across(ends_with("_datetime"), ymd_hms)
      )
  }),
  tar_target(test_discrete_values, {
    x <- uaa_data$values %>%
      filter(
        station_code == "Little Su 1",
        logger_sn == 20431757
      ) %>%
      transmute(
        timestamp_utc = datetime + hours(8),
        temp_c
      ) %>%
      filter(
        format(with_tz(timestamp_utc, "US/Alaska"), "%w") == "0",
        hour(with_tz(timestamp_utc, "US/Alaska")) == 13,
        minute(with_tz(timestamp_utc, "US/Alaska")) == 0,
        as_date(timestamp_utc) >= ymd(20210501)
      ) %>%
      arrange(timestamp_utc)

    y <- bind_rows(
      SITE_01 = x %>%
        mutate(
          temp_c = if_else(
            row_number() == 5,
            NA_real_,
            temp_c
          )
        ),
      SITE_02 = x %>%
        mutate(timestamp_utc = timestamp_utc + days(50) + hours(1), temp_c = temp_c + 2),
      .id = "station_code"
    ) %>%
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
        temp_f = 32 + temp_c * 9 / 5
      ) %>%
      group_by(station_code) %>%
      mutate(
        timestamp_local = timestamp_tz,
        datetime_local_mdyhm = format(timestamp_local, format = "%m/%d/%Y %H:%M"),
        datetime_local_dmyhm = format(timestamp_local, format = "%d-%b-%Y %H:%M"),
        date_local_mdy = format(timestamp_local, format = "%m/%d/%Y"),
        time_local_hm = format(timestamp_local, format = "%H:%M")
      ) %>%
      ungroup()

    z <- y %>%
      select(station_code, timestamp_utc) %>%
      fuzzyjoin::fuzzy_inner_join(
        test_discrete_flags,
        by = c(
          "station_code" = "station_code",
          "timestamp_utc" = "start_datetime",
          "timestamp_utc" = "end_datetime"
        ),
        match_fun = list(`==`, `>=`, `<=`)
      ) %>%
      select(
        station_code = station_code.x,
        timestamp_utc,
        flag
      )

    y %>%
      left_join(z, by = c("station_code", "timestamp_utc"))
  }),
  tar_target(test_discrete_values_plot, {
    test_discrete_values %>%
      ggplot(aes(with_tz(timestamp_utc, "US/Alaska"), temp_c)) +
      geom_line() +
      geom_point() +
      geom_point(data = . %>% filter(!is.na(flag)), aes(color = flag)) +
      facet_wrap(vars(station_code), labeller = label_both)
  }),

  tar_target(test_discrete, {
    x <- test_discrete_values %>%
      nest_by(station_code, .key = "values", .keep = TRUE) %>%
      mutate(
        start_datetime = min(values$timestamp_utc),
        end_datetime = max(values$timestamp_utc)
      ) %>%
      mutate(
        station_id = parse_number(station_code),
        interval = "DISCRETE",
        reviewed = FALSE
      ) %>%
      left_join(
        test_discrete_flags %>%
          nest_by(station_code, .key = "flags"),
        by = c("station_code")
      ) %>%
      ungroup() %>%
      mutate(
        flags = map(flags, function (x) {
          if (is.null(x)) return(tibble())
          x
        })
      ) %>%
      relocate(values, .after = last_col())

    bind_rows(
      s1 = x %>%
        filter(station_code == "SITE_01"),
      s2 = x,
      .id = "name"
    )
  }),
  tar_target(test_discrete_csv, {
    test_discrete %>%
      select(name, values) %>%
      unnest(values) %>%
      nest_by(name, .key = "values") %>%
      mutate(
        filename = list({
          filename <- file.path(test_discrete_root, glue("csv/discrete-{name}.csv"))
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
  tar_target(test_discrete_json, {
    test_discrete %>%
      nest_by(name) %>%
      mutate(
        filename = list({
          filename <- file.path(test_discrete_root, glue("json/discrete-{name}.json"))

          data %>%
            mutate(
              across(ends_with("_datetime"), ~ format(., "%FT%T.000Z", tz = "UTC")),
              flags = map(flags, function (x) {
                if (nrow(x) == 0) return(tibble())
                x %>%
                  transmute(
                    across(ends_with("_datetime"), ~ format(., "%FT%T.000Z", tz = "UTC")),
                    flag_type_id = "OTHER",
                    flag_type_other = flag
                  )
              }),
              values = map(values, function (x) {
                x %>%
                  filter(!is.na(temp_c)) %>%
                  transmute(
                    datetime = format(timestamp_utc, "%FT%T.000Z", tz = "UTC"),
                    temp_c
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
  tar_target(test_discrete_s1_csv, file.path(test_discrete_root, glue("csv/discrete-s1.csv")), format = "file"),
  tar_target(test_discrete_s1_skip_csv, {
    x <- read_csv(
      test_discrete_s1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_discrete_root, glue("csv/discrete-s1-skip.csv"))
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
  tar_target(test_discrete_s1_date_missing_csv, {
    x <- read_csv(
      test_discrete_s1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_discrete_root, glue("csv/discrete-s1-date-missing.csv"))
    x %>%
      mutate(
        datetime_utc_iso = if_else(row_number() == 5, NA_character_, datetime_utc_iso)
      ) %>%
      select(station_code, datetime_utc_iso, temp_c) %>%
      write_csv(filename, na = "")
    filename
  }),
  tar_target(test_discrete_s1_date_future_csv, {
    z <- test_discrete
    x <- read_csv(
      test_discrete_s1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_discrete_root, glue("csv/discrete-s1-date-future.csv"))
    x %>%
      mutate(
        datetime_utc_iso = if_else(row_number() == 5, '2050-10-30T18:00:00Z', datetime_utc_iso)
      ) %>%
      select(station_code, datetime_utc_iso, temp_c) %>%
      write_csv(filename, na = "")
    filename
  }),
  tar_target(test_discrete_s1_date_invalid_csv, {
    z <- test_discrete
    x <- read_csv(
      test_discrete_s1_csv,
      col_types = cols(
        .default = col_character()
      )
    )
    filename <- file.path(test_discrete_root, glue("csv/discrete-s1-date-invalid.csv"))
    x %>%
      mutate(
        datetime_utc_iso = if_else(row_number() == 5, 'INVALID', datetime_utc_iso)
      ) %>%
      select(station_code, datetime_utc_iso, temp_c) %>%
      write_csv(filename, na = "")
    filename
  }),

  tar_target(test_discrete_config_default, {
    list(
      file_skip = "0",
      file_type = "SERIES",
      interval = "DISCRETE",
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
      flag_column = "flag",
      depth_category = "",
      depth_value = "",
      depth_column = "",
      depth_units = "",
      sop_bath = "",
      accuracy = "",
      reviewed = ""
    )
  }),
  tar_target(test_discrete_config_skip, {
    tibble(
      test_name = "s1-skip",
      expected = glue("discrete-s1.json"),
      filename = glue("discrete-s1-skip.csv"),
      config = list(as_tibble(modifyList(test_discrete_config_default, list(file_skip = "1"))))
    ) %>%
      unnest(config)
  }),
  tar_target(test_discrete_config_minimal, {
    test_discrete %>%
      distinct(name) %>%
      rename(test_name = name) %>%
      rowwise() %>%
      mutate(
        expected = glue("discrete-{test_name}.json"),
        filename = glue("discrete-{test_name}.csv"),
        config = list(as_tibble(test_discrete_config_default))
      ) %>%
      unnest(config) %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      )
  }),
  tar_target(test_discrete_config_timestamp, {
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
      crossing(test_file = unique(test_discrete$name)) %>%
      rowwise() %>%
      mutate(test_name = glue("{test_file}:{test_name}")) %>%
      mutate(
        filename = glue("discrete-{test_file}.csv"),
        expected = glue("discrete-{test_file}.json"),
        config = list(as_tibble(modifyList(test_discrete_config_default, value)))
      ) %>%
      select(-value, -test_file) %>%
      unnest(config) %>%
      ungroup()
  }),
  tar_target(test_discrete_config_stations, {
    list(
      stations_code = list(
        filename = "discrete-s1.csv",
        expected = "discrete-s1.json",
        station_code = "SITE_01",
        station_column = ""
      ),
      stations_column = list(
        filename = "discrete-s1.csv",
        expected = "discrete-s1.json",
        station_column = "station_code"
      )
    ) %>%
      enframe(name = "test_name") %>%
      rowwise() %>%
      mutate(
        config = list(as_tibble(modifyList(test_discrete_config_default, value)))
      ) %>%
      select(-value) %>%
      unnest(config) %>%
      ungroup() %>%
      mutate(
        test_name = str_c(row_number(), test_name, sep = "_")
      )
  }),
  tar_target(test_discrete_config_temperature, {
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
      crossing(test_file = unique(test_discrete$name)) %>%
      rowwise() %>%
      mutate(test_name = glue("{test_file}:{test_name}")) %>%
      mutate(
        filename = glue("discrete-{test_file}.csv"),
        expected = glue("discrete-{test_file}.json"),
        config = list(as_tibble(modifyList(test_discrete_config_default, value)))
      ) %>%
      select(-value, -test_file) %>%
      unnest(config) %>%
      ungroup()
  }),

  tar_target(test_discrete_config, {
    bind_rows(
      skip = test_discrete_config_skip,
      minimal = test_discrete_config_minimal,
      timestamp = test_discrete_config_timestamp,
      stations = test_discrete_config_stations,
      temperature = test_discrete_config_temperature,
      .id = "test_group"
    )
  }),
  tar_target(test_discrete_config_csv, {
    filename <- file.path(test_discrete_root, "config-discrete.csv")
    test_discrete_config %>%
      write_csv(filename, na = "")
    filename
  }, format = "file"),

  tar_target(test_discrete_s2_csv, file.path(test_discrete_root, "csv/discrete-s2.csv"), format = "file"),
  tar_target(test_discrete_cli_csv, {
    from <- test_discrete_s2_csv
    to <- file.path("../cli/tests/files/series/csv/discrete.csv")
    file.copy(from, to, overwrite = TRUE)
    to
  }, format = "file"),
  tar_target(test_discrete_s2_json, file.path(test_discrete_root, "json/discrete-s2.json"), format = "file"),
  tar_target(test_discrete_cli_json, {
    from <- test_discrete_s2_json
    to <- file.path("../cli/tests/files/series/json/discrete.json")
    file.copy(from, to, overwrite = TRUE)
    to
  }, format = "file"),
  tar_target(test_discrete_cli_config_csv, {
    filename <- "../cli/tests/files/series/config-discrete.csv"
    test_discrete_config_minimal %>%
      filter(test_name == "2_s2") %>%
      select(-test_name, -expected) %>%
      mutate(filename = "discrete.csv") %>%
      write_csv(filename, na = "")
    filename
  }, format = "file")
)