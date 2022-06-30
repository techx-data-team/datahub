import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { ANTD_GRAY } from '../../constants';
import { StyledTable } from '../../components/styled/StyledTable';
import { useEntityData } from '../../EntityContext';
import PropertyEditModal from './PropertyEditModal';

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

export const PropertiesTab = () => {
    const { entityData } = useEntityData();
    const [isShowingAddModal, setIsShowingAddModal] = useState(false);

    const propertyTableColumns = [
        {
            width: 210,
            title: 'Name',
            dataIndex: 'key',
            sorter: (a, b) => a?.key.localeCompare(b?.key || '') || 0,
            defaultSortOrder: 'ascend',
            render: (name: string) => <NameText>{name}</NameText>,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            render: (value: string) => <ValueText>{value}</ValueText>,
        },
    ];

    return (
        <ListContainer>
            <TitleContainer>
                <Button type="text" onClick={() => setIsShowingAddModal(true)}>
                    <PlusOutlined /> Edit Properties
                </Button>
            </TitleContainer>
            <StyledTable
                pagination={false}
                // typescript is complaining that default sort order is not a valid column field- overriding this here
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                columns={propertyTableColumns}
                dataSource={entityData?.customProperties || undefined}
            />
            {isShowingAddModal && <PropertyEditModal onClose={() => setIsShowingAddModal(false)} />}
        </ListContainer>
    );
};
