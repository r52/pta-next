{
  "targets": [
    { 
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      'include_dirs': ["<!(node -p \"require('node-addon-api').include_dir\")"],
      "target_name": "winpoe",
      "sources": [ "src/winpoe.cc" ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS', '_UNICODE', 'UNICODE' ]
    }
  ]
}
