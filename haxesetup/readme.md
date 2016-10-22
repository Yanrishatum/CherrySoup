# HaxeSetup
Small program for easy management of several haxe versions.

## Usage
`haxesetup setup <path>` - Sets storage location for Haxe versions. Asked on first launch, default is `./toolkits`  
`haxesetup search <filter query>` - Searches for version of Haxe on build.haxe.org  
`haxesetup install <filter query>` - Installs new Haxe version. It's recommended to use git hash as filter.  
`haxesetup alias <git hash> <alias>` - Set an alias name to installed Haxe version.  
`haxesetup list [filter query]` - Lists all registered versions.  
`haxesetup set <git hash or alias>` - Switch to version.  
`haxesetup path <filter query>` - Prints path installed Haxe version.  
`haxesetup external list` - Displays all externally installed Haxe versions.  
`haxesetup external add <name> <path>` - Adds external library to the list with specified name and path. Name used both as git hash value and alias by default.  
### Not implemented
`haxesetup delete <git hash or alias>` - Deletes specified Haxe version.  
`haxesetup external remove <name>` - Removes external library from the list.
### OS restrictions
Currently only supports Windows.  
Problems to resolve to add Linux and Mac support:  
* Set environmental variable `%HAXEPATH%`.
* For Linux figure out how to detect x64/32 version of OS as they have different Haxe builds.
### Notes
* Sets `%HAXEPATH%` environmental variable, so it's essential to restart applications that use haxe to update said variables.

## Settings
### Global settings
Stored in `haxesetup.settings` file near executable in JSON format.  
Current fields:  
`version:Int` - Settings version.  
`toolkitListPath:String` - Path to the storage location.
### Version settings
Stored in subfolders at `<storage location>/<git hash>/.info` for installed with HaxeSetup or `<storage location>/<name>.external` for added externally.  
Current fields:  
`date:String` - Build date for installed with HaxeSetup and additional date for external.  
`size:Int` - `.tar.gz` archive size. `0` for external.  
`name:String` - Name of the `.tar.gz` file. `<name>` parameter for external.  
`url:String` - URL for `.tar.gz` file. `<path>` parameter for external.  
`branch:String` - Branch of the build. Mainly `development`, `latest`, `master` or `external`. Later used for externally installed versions.  
`git:String` - Git hash. `<name>` parameter for external.  
`path:String` - Local machine path to this Haxe version.  
`alias:String` - Current alias for this Haxe version.  

## Alternatives
### [HVM](http://lib.haxe.org/p/hvm/)
HVM - a tool for compiling and switching between different Haxe versions with ease.  
* Not sure about Windows support.
* Builds Haxe from git repo and requires all that environment setup.
* Uses copy-paste.

## Build form source
1. Simply run `haxe build.hxml`.
2. Create runnable executable with `nekotools boot haxesetup.n`.
3. Move executable anywhere where it's accesible from PATH.
4. Use.