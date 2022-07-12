import React, { useState } from 'react';
import { message, Button, Modal } from 'antd';
// import styled from 'styled-components/macro';
// import { useUpdateCustomPropertiesMutation } from '../../../../../graphql/mutations.generated';
// import { StringMapEntryInput } from '../../../../../types.generated';
import { EntityType } from '../../../../../types.generated';
// import { useEntityRegistry } from '../../../../useEntityRegistry';
import { useRefetch } from '../../EntityContext';
import PropertiesTermsTable, { PropertyDataType } from './PropertiesTermsTable';
import { useGetSearchResultsForMultipleQuery } from '../../../../../graphql/search.generated';
// import analytics, { EventType, EntityActionType } from '../../../../analytics';
interface Props {
    onClose: () => void;
}

export default function ImportCSVModal(props: Props) {
    const { onClose } = props;
    const customPropsInit: PropertyDataType[] = [];
    const [dataSource, setDataSource] = useState(customPropsInit);
    const [createButtonDisabled, setCreateButtonDisabled] = useState(false);
    const refetch = useRefetch();

    function CreateGlossaryFromCSV() {
        message.loading({ content: 'Saving new term groups and terms...' });
        setCreateButtonDisabled(true);
        const tmpQuery = '';
        const { data } = useGetSearchResultsForMultipleQuery({
            variables: {
                input: {
                    types: [EntityType.GlossaryTerm, EntityType.GlossaryNode],
                    query: tmpQuery,
                    start: 0,
                    count: 500,
                },
            },
            skip: !tmpQuery,
        });
        console.log('Sear all data: ', data);
        message.destroy();
        setCreateButtonDisabled(false);
        refetch?.();
    }

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
                    <Button onClick={CreateGlossaryFromCSV} disabled={createButtonDisabled}>
                        Create
                    </Button>
                </>
            }
        >
            <PropertiesTermsTable dataSource={dataSource} setDataSource={setDataSource} />
        </Modal>
    );
}
