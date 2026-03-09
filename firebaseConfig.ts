
// This file is safe to commit.
// It imports the configuration from a local file that is NOT committed to the repository.

import { firebaseConfig as localFirebaseConfig } from './firebaseConfig.local';

export const firebaseConfig = localFirebaseConfig;
