import { LogsConfig as ApiLogsConfig } from '@twilio-labs/serverless-api';
import path from 'path';
import { Arguments } from 'yargs';
import checkForValidServiceSid from '../checks/check-service-sid';
import { cliInfo } from '../commands/logs';
import {
  ExternalCliOptions,
  SharedFlagsWithCrdentials,
} from '../commands/shared';
import { getFullCommand } from '../commands/utils';
import { readSpecializedConfig } from './global';
import { getCredentialsFromFlags } from './utils';
import { mergeFlagsAndConfig } from './utils/mergeFlagsAndConfig';

export type LogsConfig = ApiLogsConfig & {
  cwd: string;
  accountSid: string;
  authToken: string;
  properties?: string[];
  output?: string;
};

export type LogsCliFlags = Arguments<
  SharedFlagsWithCrdentials & {
    cwd?: string;
    environment?: string;
    serviceSid?: string;
    functionSid?: string;
    tail: boolean;
    output?: string;
  }
>;

export async function getConfigFromFlags(
  flags: LogsCliFlags,
  externalCliOptions?: ExternalCliOptions
): Promise<LogsConfig> {
  let cwd = flags.cwd ? path.resolve(flags.cwd) : process.cwd();
  flags.cwd = cwd;

  let environment = flags.environment || 'dev';
  flags.environment = environment;

  const configFlags = readSpecializedConfig(cwd, flags.config, 'logsConfig', {
    projectId:
      flags.accountSid ||
      (externalCliOptions && externalCliOptions.accountSid) ||
      undefined,
    environmentSuffix: environment,
  });

  flags = mergeFlagsAndConfig(configFlags, flags, cliInfo);
  cwd = flags.cwd || cwd;
  environment = flags.environment || environment;

  const { accountSid, authToken } = await getCredentialsFromFlags(
    flags,
    externalCliOptions
  );

  const command = getFullCommand(flags);
  const serviceSid = checkForValidServiceSid(command, flags.serviceSid);
  const tail = !!flags.tail;
  const output = flags.output || externalCliOptions?.outputFormat;

  return {
    cwd,
    accountSid,
    authToken,
    environment,
    serviceSid,
    tail,
    output,
  };
}