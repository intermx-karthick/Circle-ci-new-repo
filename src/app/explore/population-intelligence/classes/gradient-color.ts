export class GradientColor {
  /**
   * Generate gradient style colors from one base color
   * @param color
   * @param colorCount colorCount number of colors you need to produce
   * @param stepFactor 0-256, how far does each color step, lower numbers will end up further from white
   */
  public generate(color: string, colorCount: number, stepFactor: number = null) {
    const gradient = [];
    // using a stepFactor lower than 256 causes the colors to all be darker, making certain things easier to read
    // but the colors will be closer together the lower the step size
    let stepSize = Math.min(256, Math.max(0, stepFactor || 256))
    const step = stepSize / colorCount;
    const RGBColor = this.convertToRGB(color);
    let redChannel = RGBColor[0] % 256;
    let greenChannel = RGBColor[1] % 256;
    let blueChannel = RGBColor[2] % 256;
    for (let i = 0; i <= colorCount; i++) {
      gradient.push(
        this.convertToHex(
          [
            redChannel,
            greenChannel,
            blueChannel
          ]
        )
      );
      redChannel += step;
      greenChannel += step;
      blueChannel += step;
    }
    return gradient.slice(0, colorCount);
  }

  /* Convert an RGB triplet to a hex string */
  public convertToHex(rgb): string {
    return '#' + this.hex(rgb[0]) + this.hex(rgb[1]) + this.hex(rgb[2]);
  }

  /* Convert a hex string to an RGB triplet */
  public convertToRGB(hex) {
    const color = [];
    color[0] = parseInt((this.trimHexColor(hex)).substring(0, 2), 16);
    color[1] = parseInt((this.trimHexColor(hex)).substring(2, 4), 16);
    color[2] = parseInt((this.trimHexColor(hex)).substring(4, 6), 16);
    return color;
  }

  private hex(c): string {
    const hexString = '0123456789abcdef';
    let i = parseInt(c);
    if (i === 0 || isNaN(c)) {
      return '00';
    }
    i = Math.round(Math.min(Math.max(0, i), 255));
    return hexString.charAt((i - i % 16) / 16) + hexString.charAt(i % 16);
  }

  /* Remove '#' in color hex string */
  private trimHexColor(color: string) {
    return (color.charAt(0) === '#') ? color.substring(1, 7) : color;
  }
}
