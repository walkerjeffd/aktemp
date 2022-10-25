library(targets)

invisible(sapply(list.files("R", pattern = ".R$", full.names = TRUE), source))

options(tidyverse.quiet = TRUE)
tar_option_set(packages = c("tidyverse", "lubridate", "sf", "janitor", "glue", "jsonlite"))

# load packages into session
if (interactive()) {
  sapply(tar_option_get("packages"), require, character.only = TRUE)
}

list(
  targets_gis,
  targets_demo,
  targets_nps,
  targets_uaa
)
