import '../src/assets/css/intermx-new.theme.less';
import '../src/assets/css/default.theme.less';
import '../src/assets/css/mobile-default.theme.less';
import '../src/assets/css/variables.less';
import '../src/assets/css/workspace.theme.less';
import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";
setCompodocJson(docJson);

export const parameters = {
  layout: "centered",
  actions: { argTypesRegex: "^on[A-Z].*" }
}
