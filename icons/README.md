# Zymbol-Lang File Icons

This directory contains the file icon for Zymbol-Lang (`.zy`) files.

## File Icons

**`zymbol-file-icon.svg`** - File icon for light themes
- Features a stylized "Z" in gradient colors (cyan/teal/green)
- Beige background (#f5f5dc) matching the main logo
- Dark "#" symbol for contrast

**`zymbol-file-icon-dark.svg`** - File icon for dark themes
- Same "Z" design with brighter gradient for better visibility
- Dark background (#2d2d2d) for dark themes
- Light gray "#" symbol (#a0a0a0)

Both icons:
- Include the "#" symbol representing Zymbol-Lang's symbolic nature
- Are designed to be recognizable at small sizes in file explorers
- Use the same gradient style matching the hummingbird logo

## Usage

### Option 1: Using with VSCode File Icon Themes

Since language extensions cannot directly set file icons in VSCode, you have two options:

1. **Request support** from popular icon theme authors (Material Icon Theme, Seti, etc.)
2. **Create a custom icon theme** that includes this icon

### Option 2: Custom Icon Theme (Advanced)

To create a custom icon theme that uses this icon:

1. Create a new VSCode extension with `iconTheme` contribution
2. Reference `zymbol-file-icon.svg` in the icon definitions
3. Map the `.zy` extension to this icon

Example `package.json` contribution:
```json
{
  "contributes": {
    "iconThemes": [
      {
        "id": "zymbol-icons",
        "label": "Zymbol Icon Theme",
        "path": "./icons/zymbol-icon-theme.json"
      }
    ]
  }
}
```

Example `zymbol-icon-theme.json`:
```json
{
  "fileExtensions": {
    "zy": "zymbol-file-icon"
  },
  "iconDefinitions": {
    "zymbol-file-icon": {
      "iconPath": "./zymbol-file-icon.svg"
    }
  }
}
```

### Option 3: Contribute to Existing Icon Themes

Popular icon themes that could be extended:

- [Material Icon Theme](https://github.com/PKief/vscode-material-icon-theme)
- [Seti Icons](https://github.com/jesseweed/seti-ui)
- [VSCode Icons](https://github.com/vscode-icons/vscode-icons)

Submit a pull request to these projects including this SVG icon.

## Design Details

### Light Theme Icon
- **Colors**: Cyan (#4ecdc4) to teal (#44a08d) to green (#3b8686) gradient
- **Background**: Beige (#f5f5dc) matching the main Zymbol-Lang logo
- **Symbol**: Dark "#" (#333) for contrast
- **Format**: SVG (vector, scalable to any size)
- **Dimensions**: 100x100 viewBox with 8px rounded corners

### Dark Theme Icon
- **Colors**: Brighter cyan (#5eeee4) to teal (#54c0ad) to green (#4ba696) gradient
- **Background**: Dark gray (#2d2d2d) for dark themes
- **Symbol**: Light gray "#" (#a0a0a0) for visibility
- **Format**: SVG (vector, scalable to any size)
- **Dimensions**: 100x100 viewBox with 8px rounded corners

## License

This icon is part of the Zymbol-Lang project and is licensed under AGPL-3.0.
