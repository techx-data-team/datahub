import React, { useState } from 'react';
import { message, Button, Modal } from 'antd';
// import styled from 'styled-components/macro';
// import { useUpdateCustomPropertiesMutation } from '../../../../../graphql/mutations.generated';
// import { StringMapEntryInput } from '../../../../../types.generated';
import { EntityType } from '../../../../../types.generated';
// import { useEntityRegistry } from '../../../../useEntityRegistry';
// import { useEntityData } from '../../EntityContext';
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
    const [createButtonDisabled, setCreateButtonDisabled] = useState(true);

    function CreateGlossaryFromCSV() {
        message.loading({ content: 'Saving new term groups and terms...' });
        setCreateButtonDisabled(false);
        const query = '';
        const { data } = useGetSearchResultsForMultipleQuery({
            variables: {
                input: {
                    types: [EntityType.GlossaryTerm, EntityType.GlossaryNode],
                    query,
                    start: 0,
                    count: 500,
                },
            },
            skip: !query,
        });
        console.log('Sear all data: ', data);
        message.destroy();
        setCreateButtonDisabled(true);
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
