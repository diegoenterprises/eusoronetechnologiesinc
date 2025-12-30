declare module "*.jsx" {
  import * as React from "react";
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module "*.json" {
  const value: any;
  export default value;
}
