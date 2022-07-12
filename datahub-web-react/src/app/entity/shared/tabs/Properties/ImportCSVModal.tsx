import React, { useState } from 'react';
import { message, Button, Modal } from 'antd';
// import styled from 'styled-components/macro';
import { useUpdateCustomPropertiesMutation } from '../../../../../graphql/mutations.generated';
import { StringMapEntryInput } from '../../../../../types.generated';
// import { useEntityRegistry } from '../../../../useEntityRegistry';
import { useEntityData, useRefetch } from '../../EntityContext';
import PropertiesTermsTable, { PropertyDataType } from './PropertiesTermsTable';

import analytics, { EventType, EntityActionType } from '../../../../analytics';

interface Props {
    onClose: () => void;
}

export default function ImportCSVModal(props: Props) {
    const { onClose } = props;
    const customPropsInit: PropertyDataType[] = [];
    const entityData = useEntityData();
    const refetch = useRefetch();
    let count = 0;
    entityData.entityData?.customProperties?.forEach((e) => {
        customPropsInit.push({
            key: count,
            name: e.key,
            value: e.value ?? '',
        });
        count += 1;
    });
    const [dataSource, setDataSource] = useState<PropertyDataType[]>(customPropsInit);
    const [updateCustomPropertiesMutation] = useUpdateCustomPropertiesMutation();
    // const _entityRegistry = useEntityRegistry();
    // setDataSource(customProps);

    const updateCustomProps = async () => {
        // console.log('HELP ME');
        // console.log(dataSource);
        message.loading({ content: 'Saving new Properties...' });
        const updateInput: StringMapEntryInput[] = [];
        try {
            if (dataSource.length > 0) {
                dataSource.forEach((e) => {
                    updateInput.push({
                        key: e.name,
                        value: e.value,
                    });
                });
                const updateStatus = updateCustomPropertiesMutation({
                    variables: {
                        input: {
                            resourceUrn: entityData.urn,
                            customProperties: updateInput,
                        },
                    },
                });
                await updateStatus;
                message.destroy();
                analytics.event({
                    type: EventType.EntityActionEvent,
                    actionType: EntityActionType.UpdateProperties,
                    entityType: entityData.entityType,
                    entityUrn: entityData.urn,
                });
                message.success({ content: 'Custom Properties Updated', duration: 2 });
                if (onClose) onClose();
                refetch?.();
            }
        } catch (e: unknown) {
            message.destroy();
            if (e instanceof Error) {
                message.error({ content: `Failed to update custom properties: \n ${e.message || ''}`, duration: 2 });
            }
        }
    };

    return (
        <Modal
            title="Import Glossary Term from csv file"
            width={1000}
            visible
            onCancel={onClose}
            footer={
                <>
                    <Button onClick={onClose} type="text">
                        Cancel
                    </Button>
                    <Button onClick={updateCustomProps}>Update</Button>
                </>
            }
        >
            <PropertiesTermsTable dataSource={dataSource} setDataSource={setDataSource} />
        </Modal>
    );
}
