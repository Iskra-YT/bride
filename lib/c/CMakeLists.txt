cmake_minimum_required(VERSION 3.20)

project(bride C)

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS
    "${CMAKE_CURRENT_SOURCE_DIR}/bride/*.c"
)

add_library(bride STATIC ${SOURCES})

target_include_directories(bride PUBLIC
    "${CMAKE_CURRENT_SOURCE_DIR}"
)