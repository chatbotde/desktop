{
  "targets": [
    {
      "target_name": "tsf_native",
      "sources": [
        "src/tsf_module.cpp",
        "src/text_inserter.cpp",
        "src/focus_tracker.cpp",
        "src/uia_helper.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "UNICODE",
        "_UNICODE"
      ],
      "libraries": [
        "ole32.lib",
        "oleaut32.lib",
        "user32.lib",
        "UIAutomationCore.lib",
        "oleacc.lib"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": ["/std:c++17"]
        }
      },
      "conditions": [
        ["OS=='win'", {
          "defines": ["_WIN32_WINNT=0x0601"]
        }]
      ]
    }
  ]
}
