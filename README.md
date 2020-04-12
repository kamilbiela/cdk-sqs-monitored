AWS CDK SQS Construct with alarms and dead letter queue

What it does
------------
Creates:
- two queues, one main and one dead letter. Dead letter has added suffix "--dead-letter" to name passed in `queueSettings.queueName`
- SNS topic with target configured to email from `alarmEmail` parameter
- alarms for both queues
  - for main queue: message age, passed as `alarmWhenMessageOlderThanSeconds` parameter
  - for dead letter: alarm triggered if there is any message
    
Alarms are configured to be sent as fast as possible. Note that SQS report values to CloudWatch every 5 mins.

Usage
-----

Minimal config:

```js
import * as cdk from '@aws-cdk/core';
import * as sqs from '@aws-cdk/aws-sqs';
import * as lib from 'cdk-sqs-monitored';

const app = new cdk.App();

export class SampleAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
      super(scope, id, props);
      
      new lib.MonitoredQueue(this, 'q1', {
          alarmEmail: 'your-email@test.com',
          alarmWhenMessageOlderThanSeconds: 300,
          maxReceiveCount: 3,
          queueSettings: {
              queueName: 'test-queue',
          }
      })
  }
}

new SampleAppStack(app, 'SampleappStack');
```

queueSettings parameter expects standard @aws-cdk/aws-sqs [QueueProps](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-sqs.QueueProps.html) object

Modyfying and PR
----------------
You're always welcome to create PR, but it might be best solution for you to just fork the repository and apply
the changes in your repo. 

License 
-------
MIT