# Character and station artwork

Prepared using the built-in image-generation tool from the user's supplied references. Original references were not altered. The generated PNG files preserve transparency where applicable.

| Asset | Use |
| --- | --- |
| `dist/assets/staff-sprites.png` | Three equal sprite cells: Sales, Chef, Hands with trolley |
| `dist/assets/sales-station.png` | Open-kitchen station without baked-in staff; assigned people are rendered separately |
| `dist/assets/garden-base.png` | Garden map with the four old shops removed; central warehouse retained |

## Character prompt

Use case: stylized-concept. Asset type: production transparent pixel-art character sprite atlas for an event management game map. Use the attached image as the exact style and costume reference. Create ONE horizontal sprite sheet with exactly THREE equal square cells, a 3:1 canvas. Each character fully fits its own cell, centered with feet on the same baseline at 92% height, full body at 85% cell height. Left cell: red-cap red-apron SALES PERSON in idle pose. Middle cell: white-hat white-jacket CHEF in idle pose. Right cell: blue-cap blue-overalls HANDS worker pushing a small trolley with one brown box, matching the transport pose. Preserve the reference chibi proportions, warm faces, dark crisp pixel outlines and outfit colors. Genuine transparent background in all cells, no shadows beyond feet, no scenery, no labels, no text, no borders, no additional characters. All three consistent scale. Trolley must fit entirely within rightmost cell. Make this a clean usable game sprite atlas, not a poster.

## Station prompt

Reference image: the supplied open-kitchen station concept. Create ONE isolated game building sprite: a compact roofless food sales station viewed in the same elevated front-facing pixel-art perspective as the reference's small bottom-row station icons. Silver double glass-door refrigerator at back, prep benches and stove in middle, warm wooden U-shaped serving counter at front with POS and packaging, subtle green plants and warm hanging bulbs. Match the reference pixel art style and proportions. No people anywhere: staff will be added dynamically in code. No customers, text, signage, dimensions or poster layout. Single station centered filling about 90% of a square canvas, entire building visible, genuine transparent background. Topmost refrigerator edge centered near 5% canvas height. Clean crisp dark outlines, consistent pixel scale, game-ready asset.

## Background edit prompt

Edit target: the provided botanical garden map. Remove ONLY the four small striped-roof shops (upper left, upper right, lower left, lower right), including their attached props and shadows. Fill their footprints with the same pale sandy ground seamlessly, leaving the four round sandy clearings EMPTY. Keep the central warehouse tent exactly unchanged. Preserve every path, tree, pond, bridge, garden, perspective, framing and 16:9 aspect ratio. No people, text or new structures. This is a background layer for a game whose shops will be placed separately by code.
