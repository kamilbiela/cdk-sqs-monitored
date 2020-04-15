import * as sqs from '@aws-cdk/aws-sqs';
import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as cwactions from '@aws-cdk/aws-cloudwatch-actions';
import * as snssubs from '@aws-cdk/aws-sns-subscriptions';

export interface MonitoredQueueProps {
  /**
   * Queue settings, except deadLetterQueue property
   */
  readonly queueSettings: Omit<sqs.QueueProps, 'deadLetterQueue'>,

  /**
   * Max receive count of message after which it's moved to dead letter queue
   * @default 3
   */
  readonly maxReceiveCount?: number;

  /**
   * Issue alarm when message is older than X seconds in queue
   */
  readonly alarmWhenMessageOlderThanSeconds: number;

  /**
   * Alarm to which send CloudWatch alarms/ok state changes
   */
  readonly alarmEmail: string;
}

export class MonitoredQueue extends cdk.Construct {
  /** @returns the Arn of the main queue */
  public readonly queueArn: string;
  
  /** @returns the URL of the main queue */
  public readonly queueUrl: string;

  /** @returns the name of the main queue */
  public readonly queueName: string;
  
  /** @returns the Arn of the dead letter queue */
  public readonly deadLetterQueueArn: string;
  
  /** @returns the URL of the dead letter queue */
  public readonly deadLetterQueueUrl: string;
  
  /** @returns the name of the dead letter queue */
  public readonly deadLetterQueueName: string;

  constructor(scope: cdk.Construct, id: string, props: MonitoredQueueProps) {
    super(scope, id);
    
    const deadLetterQueue = new sqs.Queue(this, 'MonitoredQueueDeadLetter', {
      queueName: `${props.queueSettings.queueName}--dead-letter`
    });
    const queue = new sqs.Queue(this, 'MonitoredQueue', {
      ...props.queueSettings,
      deadLetterQueue: {
        maxReceiveCount: props.maxReceiveCount || 3,
        queue: deadLetterQueue,
      }
    });

    const queueAlarm = new cw.Alarm(this, 'QueueAlarm', {
      alarmDescription: `Alarm for ${queue.queueName}`,
      metric: queue.metricApproximateAgeOfOldestMessage(),
      threshold: props.alarmWhenMessageOlderThanSeconds,
      evaluationPeriods: 1,
      period: cdk.Duration.minutes(5),
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.IGNORE,
      statistic: cw.Statistic.MAXIMUM,
    });
    
    const deadLetterQueueAlarm = new cw.Alarm(this, 'DeadLetterQueueAlarm', {
      alarmDescription: `Alarm for dead letter ${deadLetterQueue.queueName}`,
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      period: cdk.Duration.minutes(5),
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.IGNORE,
      statistic: cw.Statistic.MAXIMUM,
    });

    const topic = new sns.Topic(this, 'Topic');
    topic.addSubscription(
      new snssubs.EmailSubscription(props.alarmEmail)
    );
    
    const snsAction = new cwactions.SnsAction(topic);

    queueAlarm.addAlarmAction(snsAction);
    queueAlarm.addOkAction(snsAction);

    deadLetterQueueAlarm.addAlarmAction(snsAction);
    deadLetterQueueAlarm.addOkAction(snsAction);

    this.queueArn = queue.queueArn;
    this.queueUrl = queue.queueUrl;
    this.queueName = queue.queueName;

    this.deadLetterQueueArn = deadLetterQueue.queueArn;
    this.deadLetterQueueUrl = deadLetterQueue.queueUrl;
    this.deadLetterQueueName = deadLetterQueue.queueName;
  }
}
