import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography, Button, Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { useEntityData, useRefetch } from '../../shared/EntityContext';
import { ANTD_GRAY } from '../../shared/constants';
import { StyledTable } from '../../shared/components/styled/StyledTable';
import StyledEditableTable, { BaseItem } from '../../shared/components/styled/StyledEditableTable';
import analytics, { EventType, EntityActionType } from '../../../analytics';
import { GlossaryTermLovInput } from '../../../../types.generated';
import { useUpdateGlossaryTermLovMutation } from '../../../../graphql/glossaryTerm.generated';

const NameText = styled(Typography.Text)`
    font-family: 'Roboto Mono', monospace;
    font-weight: 600;
    font-size: 12px;
    color: ${ANTD_GRAY[9]};
`;

const ValueText = styled(Typography.Text)`
    font-family: 'Roboto Mono', monospace;
    font-weight: 400;
    font-size: 12px;
    color: ${ANTD_GRAY[8]};
`;

const ListContainer = styled.div`
    width: 100%;
`;

const TitleContainer = styled.div`
    align-items: center;
    border-bottom: solid 1px ${ANTD_GRAY[4]};
    display: flex;
    justify-content: space-between;
    padding: 15px 20px;
    margin-bottom: 30px;
`;

interface LovItem extends BaseItem {
    internal_key: number;
    key: string;
    name: string;
    descriptions: string | undefined;
}

export default function GlossayRelatedTerms() {
    const { urn, entityType, entityData } = useEntityData();
    const refetch = useRefetch();
    const [isShowingAddModal, setIsShowingAddModal] = useState(false);
    const lovArrays: LovItem[] = [];
    let counter = 0;
    entityData?.listOfValue?.forEach((el) => {
        lovArrays.push({
            internal_key: counter,
            key: el.key,
            name: el.name,
            descriptions: el.descriptions || undefined,
        });
        counter += 1;
    });
    const [dataSource, setDataSource] = useState(lovArrays);
    const [updateGlossaryTermLovMutation] = useUpdateGlossaryTermLovMutation();
    const defaultLovInit = (key: number | string) => {
        return { internal_key: key, key: 'LOV_KEY', name: 'LOV Name' } as LovItem;
    };

    const lovTableColumns = [
        {
            width: 210,
            title: 'Key',
            dataIndex: 'key',
            editable: true,
            // sorter: (a, b) => a?.key.localeCompare(b?.key || '') || 0,
            // defaultSortOrder: 'ascend',
            render: (name: string) => <NameText>{name}</NameText>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            editable: true,
            render: (value: string) => <ValueText>{value}</ValueText>,
        },
        {
            title: 'Descriptions',
            dataIndex: 'descriptions',
            editable: true,
            render: (value: string) => <ValueText>{value}</ValueText>,
        },
    ];

    const updateGlossaryLov = async () => {
        // console.log('HELP ME');
        // console.log(dataSource);
        message.loading({ content: 'Saving new List of Values...' });
        const updateInput: GlossaryTermLovInput[] = [];
        try {
            if (dataSource.length > 0) {
                dataSource.forEach((e) => {
                    updateInput.push({
                        key: e.key,
                        name: e.name,
                        descriptions: e.descriptions || undefined,
                    });
                });
                const updateStatus = updateGlossaryTermLovMutation({
                    variables: {
                        input: {
                            urn,
                            listOfValue: updateInput,
                        },
                    },
                });
                await updateStatus;
                message.destroy();
                analytics.event({
                    type: EventType.EntityActionEvent,
                    actionType: EntityActionType.UpdateProperties,
                    entityType,
                    entityUrn: urn,
                });
                message.success({ content: 'List of Values Updated', duration: 2 });
                setIsShowingAddModal(true);
                refetch?.();
            }
        } catch (e: unknown) {
            message.destroy();
            if (e instanceof Error) {
                message.error({ content: `Failed to update List of Values: \n ${e.message || ''}`, duration: 2 });
            }
        }
    };

    return (
        <ListContainer>
            <TitleContainer>
                <Button type="text" onClick={() => setIsShowingAddModal(true)}>
                    <PlusOutlined /> Edit
                </Button>
            </TitleContainer>
            <StyledTable
                pagination={false}
                // typescript is complaining that default sort order is not a valid column field- overriding this here
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                columns={lovTableColumns}
                dataSource={entityData?.listOfValue || undefined}
            />
            {isShowingAddModal && (
                <Modal
                    title="Edit Properties"
                    visible
                    width="65vw"
                    onCancel={() => setIsShowingAddModal(false)}
                    footer={
                        <>
                            <Button onClick={() => setIsShowingAddModal(false)} type="text">
                                Cancel
                            </Button>
                            <Button onClick={updateGlossaryLov}>Update</Button>
                        </>
                    }
                >
                    <StyledEditableTable
                        dataSource={dataSource}
                        setDataSource={setDataSource}
                        columnList={lovTableColumns}
                        defaultItemGen={defaultLovInit}
                    />
                </Modal>
            )}
        </ListContainer>
    );
}
