# generate large series file

source("_targets.R")

tar_load(nps_data)

nps_data$values %>%
  nrow()

nps_data$stations

nps_data$values %>%
  filter(station_code == "KIJIL_01_TEMP") %>%
  write_csv("~/data/aktemp/nps/KIJIL_01_TEMP.csv")

nps_data$values %>%
  write_csv("~/data/aktemp/nps/all-values.csv")
