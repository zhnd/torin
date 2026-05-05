'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  REMOVE_TAPD_CREDENTIAL,
  SET_TAPD_CREDENTIAL,
  TAPD_SETTINGS,
} from '../../graphql';
import type { TapdSettingsData } from '../../types';

export function useService() {
  const { data, loading } = useQuery<TapdSettingsData>(TAPD_SETTINGS);
  const [setCred, { loading: saving }] = useMutation(SET_TAPD_CREDENTIAL, {
    refetchQueries: [{ query: TAPD_SETTINGS }],
  });
  const [removeCred, { loading: removing }] = useMutation(
    REMOVE_TAPD_CREDENTIAL,
    {
      refetchQueries: [{ query: TAPD_SETTINGS }],
    }
  );

  const status = data?.tapdCredentialStatus;
  const configured = Boolean(status?.configured);

  const [accessToken, setAccessToken] = useState('');

  async function onSave() {
    const trimmed = accessToken.trim();
    if (!trimmed) {
      toast.error('Access token is required');
      return;
    }
    try {
      await setCred({ variables: { input: { accessToken: trimmed } } });
      toast.success('Tapd credential saved');
      setAccessToken('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function onRemove() {
    try {
      await removeCred();
      setAccessToken('');
      toast.success('Tapd credential removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Remove failed');
    }
  }

  return {
    loading,
    saving,
    removing,
    configured,
    status,
    accessToken,
    setAccessToken,
    onSave,
    onRemove,
  };
}
