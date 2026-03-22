# How to Enable Zymbol File Icons

The Zymbol-Lang extension now includes a custom file icon for `.zy` files.

## Automatic Icon Display (VSCode 1.67+)

Starting with VSCode 1.67, the language icon should automatically appear for `.zy` files when you have the extension installed. No additional setup needed!

## Manual Activation (Optional Icon Theme)

If you want to use the full icon theme (recommended for consistency), follow these steps:

### Step 1: Install the Extension

Make sure the Zymbol-Lang extension is installed and enabled.

### Step 2: Activate the Icon Theme

1. Open VSCode Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "File Icon Theme" and select **"Preferences: File Icon Theme"**
3. Look for **"Zymbol File Icons"** in the list
4. Select it

### Step 3: Verify

Open any `.zy` file and check that the file icon appears in:
- The file explorer sidebar
- The editor tab
- Breadcrumbs

## What You'll See

The icon features:
- A stylized **"Z"** in cyan-to-green gradient (matching the hummingbird logo)
- A **"#"** symbol at the bottom (representing Zymbol's symbolic nature)
- Beige background consistent with the main logo

## Troubleshooting

### Icon doesn't appear

1. **Reload VSCode**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Check extension is active**: Look in Extensions panel for "Zymbol-Lang"
3. **Verify file extension**: Make sure your file ends with `.zy`

### Using with other icon themes

If you're using another icon theme (Material, Seti, etc.), the Zymbol icon may not appear. You have two options:

1. **Switch to Zymbol File Icons** (shows only Zymbol icons + VSCode defaults)
2. **Request support** from your preferred icon theme maintainer

## Reverting to Default

To go back to VSCode default icons:

1. Command Palette → "Preferences: File Icon Theme"
2. Select **"None"** or your previous icon theme

## Technical Details

- Icon format: SVG (scalable vector graphics)
- Location: `icons/zymbol-file-icon.svg`
- Theme definition: `icons/zymbol-icon-theme.json`
- Contribution point: `package.json` → `contributes.iconThemes`
