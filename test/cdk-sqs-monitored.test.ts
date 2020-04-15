import { expect as expectCDK, countResourcesLike, countResources } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as lib from '../lib/index';

const defaultProps: lib.MonitoredQueueProps = {
  alarmEmail: 'test@test.com',
  alarmWhenMessageOlderThanSeconds: 13,
  maxReceiveCount: 13,
  queueSettings: {
    queueName: 'queue-name'
  }
}
test('Queues created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  
  new lib.MonitoredQueue(stack, 'MyTestConstruct', {
    ...defaultProps
  });
  
  expectCDK(stack).to( 
    countResources("AWS::SQS::Queue", 2)
  );
});

test('Main queue created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  
  new lib.MonitoredQueue(stack, 'MyTestConstruct', {
    ...defaultProps
  });
  
  expectCDK(stack).to(
    countResourcesLike("AWS::SQS::Queue", 1, {
      RedrivePolicy: {
        deadLetterTargetArn: {
          "Fn::GetAtt": [
            "MyTestConstructMonitoredQueueDeadLetter5A3FF5B2",
            "Arn"
          ]
        },
        "maxReceiveCount": defaultProps.maxReceiveCount,
      }
    })
  );
});

test('Main queue alarm created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  
  new lib.MonitoredQueue(stack, 'MyTestConstruct', {
    ...defaultProps
  });
  
  expectCDK(stack).to(
    countResourcesLike("AWS::CloudWatch::Alarm", 1, {
      AlarmDescription: {
        "Fn::Join": [
          "",
          [
            "Alarm for ",
            {"Fn::GetAtt": [
              "MyTestConstructMonitoredQueue023C3E2B",
              "QueueName"
            ]}
          ]
        ]
      },
      AlarmActions: [
        {"Ref": 'MyTestConstructTopicFC8BAA25'},
      ]
    })
  );
});
  
test('Dead letter queue alarm created', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  
  new lib.MonitoredQueue(stack, 'MyTestConstruct', {
    ...defaultProps
  });
  
  expectCDK(stack).to(
    countResourcesLike("AWS::CloudWatch::Alarm", 1, {
      AlarmDescription: {
        "Fn::Join": [
          "",
          [
            "Alarm for dead letter ",
            {"Fn::GetAtt": [
              "MyTestConstructMonitoredQueueDeadLetter5A3FF5B2",
              "QueueName"
            ]}
          ]
        ]
      },
      AlarmActions: [
        {"Ref": 'MyTestConstructTopicFC8BAA25'},
      ]
    })
  );
});

// test('SNS Topic is created', () => {
//   const app = new cdk.App();
//   const stack = new cdk.Stack(app, "TestStack");
  
//   new lib.MonitoredQueue(stack, 'MyTestConstruct', {
//     ...defaultProps
//   });
  
//   expect(stack).toHaveResource("AWS::SNS::Topic");
// })

// test('SNS Subscription is created', () => {
//   const app = new cdk.App();
//   const stack = new cdk.Stack(app, "TestStack");
  
//   new lib.MonitoredQueue(stack, 'MyTestConstruct', {
//     ...defaultProps
//   });
  
//   expect(stack).toHaveResource("AWS::SNS::Subscription", {
//     Protocol: "email",
//     TopicArn: {
//       Ref: "MyTestConstructTopicFC8BAA25"
//     },
//     Endpoint: defaultProps.alarmEmail,
//   });
// });

// test('SNS Subscription is created', () => {
//   const app = new cdk.App();
//   const stack = new cdk.Stack(app, "TestStack");
  
//   new lib.MonitoredQueue(stack, 'MyTestConstruct', {
//     ...defaultProps
//   });
  
//   expect(stack).toHaveResource("AWS::Cloudwatch::Alarm", {
//     AlarmActions: [
//       { Ref: "" },
//     ],
//     OKActions: [
//       { Ref: "" },
//     ]
//   });