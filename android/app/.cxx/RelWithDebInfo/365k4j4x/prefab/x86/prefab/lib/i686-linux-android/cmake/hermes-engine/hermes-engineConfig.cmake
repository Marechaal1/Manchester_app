if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/home/gunnar/.gradle/caches/8.14.3/transforms/f9893e2cc4d570e333af6baffa5f0c0a/transformed/hermes-android-0.81.4-release/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/gunnar/.gradle/caches/8.14.3/transforms/f9893e2cc4d570e333af6baffa5f0c0a/transformed/hermes-android-0.81.4-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

