# LibSetup
Small program for easy management of several haxelib directories.

## Usage
`libsetup` - Shows usage and lists all registered libraries.  
`libsetup <name>` - switch to library.  
`libsetup -add <name> <path>` - Adds new library to the storage. Path should be absolute.  
`libsetup -remove <name>` - Removes existing library from the storage.  
`libsetup -rename <current_name> <new_name>` - Changes existing library name.  
`libsetup -peek <name> ` - Take a peek at library contents.

## Manual list modifications
Libsetup will create `libsetup_list.txt` file placed near the executable. You can manually edit this file, but there are few rules:

1. Format is: `<name>:<path>` per line.
2. `:` character is prohibited in library names.
3. Use `/` slash in path and do not include trailing slash, otherwise that'll break active library detection.

## Build form source
1. Simply run `haxe build.hxml`.
2. Create runnable executable with `nekotools boot libsetup.n`.
3. Move executable anywhere where it's accesible from PATH.
4. Use.

(see example in `build.bat`)