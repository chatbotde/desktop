{
  "targets": [
    {
      "target_name": "macos_input_method",
      "sources": [
        "src/input_method_module.mm",
        "src/input_method_controller.mm",
        "src/text_inserter.mm"
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "MACOSX_DEPLOYMENT_TARGET": "10.13",
            "OTHER_CFLAGS": [
              "-ObjC++",
              "-std=c++17"
            ],
            "OTHER_LDFLAGS": [
              "-framework Cocoa",
              "-framework Carbon",
              "-framework InputMethodKit"
            ]
          }
        }]
      ]
    }
  ]
}
