require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNSqlite2"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "10.0", :osx => "10.14", :tvos => "10.0" }
  s.source       = { :git => "https://github.com/craftzdog/react-native-sqlite-2.git", :tag => "master" }
  s.source_files = "**/*.{h,m}"
  s.requires_arc = true
  s.library      = "sqlite3"

  s.dependency "React-Core"
end
