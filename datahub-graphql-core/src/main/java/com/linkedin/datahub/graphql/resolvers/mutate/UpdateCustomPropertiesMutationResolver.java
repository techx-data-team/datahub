package com.linkedin.datahub.graphql.resolvers.mutate;

import com.linkedin.common.urn.CorpuserUrn;
import com.linkedin.common.urn.Urn;
import com.linkedin.data.template.StringMap;
import com.linkedin.datahub.graphql.QueryContext;
import com.linkedin.datahub.graphql.exception.AuthorizationException;
import com.linkedin.datahub.graphql.generated.CustomPropertiesUpdateInput;
import com.linkedin.datahub.graphql.generated.StringMapEntryInput;
import com.linkedin.metadata.Constants;
import com.linkedin.metadata.entity.EntityService;
import graphql.schema.DataFetcher;
import graphql.schema.DataFetchingEnvironment;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static com.linkedin.datahub.graphql.resolvers.ResolverUtils.*;

@Slf4j
@RequiredArgsConstructor
public class UpdateCustomPropertiesMutationResolver implements DataFetcher<CompletableFuture<Boolean>> {
    private final EntityService _entityService;

  @Override
  public CompletableFuture<Boolean> get(DataFetchingEnvironment environment) throws Exception {
    final CustomPropertiesUpdateInput input = bindArgument(environment.getArgument("input"), CustomPropertiesUpdateInput.class);
    Urn targetUrn = Urn.createFromString(input.getResourceUrn());
    log.info("Updating description. input: {}", input.toString());
    switch (targetUrn.getEntityType()) {
    //   case Constants.DATASET_ENTITY_NAME:
    //     return updateDatasetDescription(targetUrn, input, environment.getContext());
      case Constants.GLOSSARY_TERM_ENTITY_NAME:
        return updateGlossaryTermDescription(targetUrn, input, environment.getContext());
     
      default:
        throw new RuntimeException(
            String.format("Failed to update description. Unsupported resource type %s provided.", targetUrn));
    }
  }

  private CompletableFuture<Boolean> updateGlossaryTermDescription(Urn targetUrn, CustomPropertiesUpdateInput input, QueryContext context) {
    return CompletableFuture.supplyAsync(() -> {

      if (!CustomPropertiesUtils.isAuthorizedToUpdateCustomProperty(context, targetUrn)) {
        throw new AuthorizationException(
            "Unauthorized to perform this action. Please contact your DataHub administrator.");
      }
      DescriptionUtils.validateLabelInput(targetUrn, _entityService);

      try {
        Urn actor = CorpuserUrn.createFromString(context.getActorUrn());
        java.util.List<StringMapEntryInput>  inputProps = input.getCustomProperties();
        Map<String, String> inputMap = new HashMap<>();
        inputProps.forEach((element) -> {
            inputMap.put(element.getKey(), element.getValue());
        });
        StringMap finalMap = new StringMap(inputMap);

        CustomPropertiesUtils.updateGlossaryTermCustomProperty(
            finalMap,
            targetUrn,
            actor,
            _entityService);
        return true;
      } catch (Exception e) {
        log.error("Failed to perform update against input {}, {}", input.toString(), e.getMessage());
        throw new RuntimeException(String.format("Failed to perform update against input %s", input.toString()), e);
      }
    });
  }

}
