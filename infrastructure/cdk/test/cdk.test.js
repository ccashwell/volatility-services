"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const Cdk = require("../lib/services-stack");
test("SQS Queue and SNS Topic Created", () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Cdk.CdkStack(app, "MyTestStack");
    // THEN
    const template = assertions_1.Template.fromStack(stack);
    template.hasResourceProperties("AWS::SQS::Queue", {
        VisibilityTimeout: 300
    });
    template.resourceCountIs("AWS::SNS::Topic", 1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGsudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFrQztBQUNsQyx1REFBaUQ7QUFDakQsNkNBQTRDO0FBRTVDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7SUFDM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7SUFDekIsT0FBTztJQUNQLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDbEQsT0FBTztJQUVQLE1BQU0sUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRTFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRTtRQUNoRCxpQkFBaUIsRUFBRSxHQUFHO0tBQ3ZCLENBQUMsQ0FBQTtJQUNGLFFBQVEsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDaEQsQ0FBQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCJcbmltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSBcImF3cy1jZGstbGliL2Fzc2VydGlvbnNcIlxuaW1wb3J0ICogYXMgQ2RrIGZyb20gXCIuLi9saWIvc2VydmljZXMtc3RhY2tcIlxuXG50ZXN0KFwiU1FTIFF1ZXVlIGFuZCBTTlMgVG9waWMgQ3JlYXRlZFwiLCAoKSA9PiB7XG4gIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKClcbiAgLy8gV0hFTlxuICBjb25zdCBzdGFjayA9IG5ldyBDZGsuQ2RrU3RhY2soYXBwLCBcIk15VGVzdFN0YWNrXCIpXG4gIC8vIFRIRU5cblxuICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaylcblxuICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoXCJBV1M6OlNRUzo6UXVldWVcIiwge1xuICAgIFZpc2liaWxpdHlUaW1lb3V0OiAzMDBcbiAgfSlcbiAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKFwiQVdTOjpTTlM6OlRvcGljXCIsIDEpXG59KVxuIl19