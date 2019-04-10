
Pod::Spec.new do |s|
  s.name         = "RNSqlite2"
  s.version      = "1.0.0"
  s.summary      = "RNSqlite2"
  s.description  = <<-DESC
                  RNSqlite2
                   DESC
  s.homepage     = "https://github.com/craftzdog/react-native-sqlite-2"
  s.license      = "Apache 2.0"
  s.author       = { "author" => "hi@craftz.dog" }
  s.platform     = :ios, "7.0"
  s.source       = { :git => "https://github.com/craftzdog/react-native-sqlite-2.git", :tag => "master" }
  s.source_files = "**/*.{h,m}"
  s.requires_arc = true
  s.library      = "sqlite3"

  s.dependency "React"
end

