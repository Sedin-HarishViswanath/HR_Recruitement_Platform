import axios from 'axios';
import { env } from '../../config/env';

export interface JDoodleExecuteParams {
  script: string;
  language: string;
  versionIndex: string;
  stdin?: string;
}

export const executeCode = async (params: JDoodleExecuteParams) => {
  const { script, language, versionIndex, stdin } = params;

  const response = await axios.post('https://api.jdoodle.com/v1/execute', {
    clientId: process.env.JDOODLE_CLIENT_ID,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    script,
    language,
    versionIndex,
    stdin,
  });

  return response.data;
};
