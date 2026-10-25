Pod::Spec.new do |s|
  s.name           = 'ReceiptOcr'
  s.version        = '1.0.0'
  s.summary        = 'On-device receipt text recognition with Apple Vision'
  s.author         = 'IBO'
  s.homepage       = 'https://raumwerkpro.de'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.frameworks     = 'Vision', 'PDFKit'

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end
