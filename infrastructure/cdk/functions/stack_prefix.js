"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackPrefix = void 0;
exports.stackPrefix = (namespace, environment, stage) => {
    return (componentName) => `${namespace}-${environment}-${stage}-${componentName}`;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2tfcHJlZml4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhY2tfcHJlZml4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsV0FBVyxHQUFHLENBQUMsU0FBaUIsRUFBRSxXQUFtQixFQUFFLEtBQWEsRUFBRSxFQUFFO0lBQ25GLE9BQU8sQ0FBQyxhQUFxQixFQUFFLEVBQUUsQ0FBQyxHQUFHLFNBQVMsSUFBSSxXQUFXLElBQUksS0FBSyxJQUFJLGFBQWEsRUFBRSxDQUFBO0FBQzNGLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBzdGFja1ByZWZpeCA9IChuYW1lc3BhY2U6IHN0cmluZywgZW52aXJvbm1lbnQ6IHN0cmluZywgc3RhZ2U6IHN0cmluZykgPT4ge1xuICByZXR1cm4gKGNvbXBvbmVudE5hbWU6IHN0cmluZykgPT4gYCR7bmFtZXNwYWNlfS0ke2Vudmlyb25tZW50fS0ke3N0YWdlfS0ke2NvbXBvbmVudE5hbWV9YFxufVxuIl19