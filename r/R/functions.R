read_nps_file <- function (nps_file) {
  csv <- read_csv(nps_file, col_types = cols()) %>%
    clean_names() %>%
    rename(datetime = x1, station_code = agency_id, temp_c = temperature, depth_m = depth)

  stations <- distinct(csv, station_code, waterbody_name, latitude, longitude)
  stopifnot(sum(duplicated(stations$station_code)) == 0)
  values <- select(csv, station_code, datetime, temp_c, depth_m) %>%
    filter(!is.na(temp_c))

  list(
    stations = stations,
    values = values
  )
}

export_nps_values <- function (nps_root, nps_data) {
  values <- nps_data$values %>%
    arrange(station_code, depth_m, datetime) %>%
    nest_by(station_code, depth_m) %>%
    mutate(
      filename = file.path(nps_root, "files", glue("{station_code}-{depth_m}.csv"))
    )

  filelist_filename <- "export/nps/filelist.csv"
  values %>%
    transmute(station_code, depth_m, filename = basename(filename)) %>%
    write_csv(filelist_filename)

  unlink(file.path(nps_root, "files", "*"))
  for (i in 1:nrow(values)) {
    write_csv(values$data[[i]], values$filename[i])
  }

  c(filelist_filename, values$filename)
}

read_uaa_file <- function (uaa_file) {
  csv <- read_csv(uaa_file, col_types = cols()) %>%
    clean_names() %>%
    rename(station_code = site_id, temp_c = temperature) %>%
    mutate(station_code = str_replace_all(station_code, "/", "-"))

  stations <- distinct(csv, station_code, latitude, longitude) %>%
    group_by(station_code) %>%
    summarise(across(c(latitude, longitude), mean))
  stopifnot(sum(duplicated(stations$station_code)) == 0)
  values <- select(csv, station_code, logger_sn, datetime, temp_c) %>%
    filter(!is.na(temp_c))

  list(
    stations = stations,
    values = values
  )
}

export_uaa_values <- function (uaa_root, uaa_data) {
  values <- uaa_data$values %>%
    arrange(station_code, logger_sn, datetime) %>%
    nest_by(station_code, logger_sn) %>%
    mutate(
      filename = file.path(uaa_root, "files", glue("{station_code}-{logger_sn}.csv"))
    ) %>%
    head(3)

  filelist_filename <- file.path(uaa_root, "filelist.csv")
  values %>%
    transmute(station_code, filename = basename(filename)) %>%
    write_csv(filelist_filename)

  unlink(file.path(uaa_root, "files", "*"))
  for (i in 1:nrow(values)) {
    write_csv(values$data[[i]], values$filename[i])
  }

  c(filelist_filename, values$filename)
}