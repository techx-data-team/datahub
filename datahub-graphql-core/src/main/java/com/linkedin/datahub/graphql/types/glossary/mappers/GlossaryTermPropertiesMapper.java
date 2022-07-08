package com.linkedin.datahub.graphql.types.glossary.mappers;

import com.linkedin.datahub.graphql.generated.GlossaryTermProperties;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Nonnull;

import com.linkedin.datahub.graphql.types.common.mappers.StringMapMapper;
import com.linkedin.datahub.graphql.types.mappers.ModelMapper;

/**
 * Maps Pegasus {@link RecordTemplate} objects to objects conforming to the GQL
 * schema.
 *
 * To be replaced by auto-generated mappers implementations
 */
public class GlossaryTermPropertiesMapper
    implements ModelMapper<com.linkedin.glossary.GlossaryTermInfo, GlossaryTermProperties> {

  public static final GlossaryTermPropertiesMapper INSTANCE = new GlossaryTermPropertiesMapper();

  public static GlossaryTermProperties map(@Nonnull final com.linkedin.glossary.GlossaryTermInfo glossaryTermInfo) {
    return INSTANCE.apply(glossaryTermInfo);
  }

  @Override
  public GlossaryTermProperties apply(@Nonnull final com.linkedin.glossary.GlossaryTermInfo glossaryTermInfo) {
    com.linkedin.datahub.graphql.generated.GlossaryTermProperties result = new com.linkedin.datahub.graphql.generated.GlossaryTermProperties();
    result.setDefinition(glossaryTermInfo.getDefinition());
    result.setDescription(glossaryTermInfo.getDefinition());
    result.setTermSource(glossaryTermInfo.getTermSource());
    if (glossaryTermInfo.hasName()) {
      result.setName(glossaryTermInfo.getName());
    }
    if (glossaryTermInfo.hasSourceRef()) {
      result.setSourceRef(glossaryTermInfo.getSourceRef());
    }
    if (glossaryTermInfo.hasSourceUrl()) {
      result.setSourceUrl(glossaryTermInfo.getSourceUrl().toString());
    }
    if (glossaryTermInfo.hasCustomProperties()) {
      result.setCustomProperties(StringMapMapper.map(glossaryTermInfo.getCustomProperties()));
    }
    if (glossaryTermInfo.hasListOfValue()) {
      List<com.linkedin.datahub.graphql.generated.GlossaryTermLOV> lovList = new ArrayList<com.linkedin.datahub.graphql.generated.GlossaryTermLOV>();
      glossaryTermInfo.getListOfValue().forEach((element) -> {
        com.linkedin.datahub.graphql.generated.GlossaryTermLOV output = new com.linkedin.datahub.graphql.generated.GlossaryTermLOV();
        output.setKey(element.getKey());
        output.setName(element.getName());
        if (element.hasDescriptions()) {
          output.setDescriptions(element.getDescriptions());
        }
        lovList.add(output);
      });
      result.setListOfValue(lovList);
    }
    return result;
  }
}
