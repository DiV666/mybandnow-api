@instruments
Feature: Update a catalog instrument
  In order to manage the shared catalog safely
  Only admin-scoped users can update instruments

  Background:
    Given An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"

  Scenario: An admin-scoped user updates an existing catalog instrument
    Given An authenticated admin user "catalog-admin" with password "asdASD123!"
    When I send a PUT request to "/v1/instruments/0e7a0d5f-3d2a-4bc1-8d4d-100000000001" with body:
      """
      {
        "name": "Electric Guitar",
        "description": "Updated catalog description"
      }
      """
    Then the response status code should be 200
    And the response should be empty
    When I send a GET request to "/v1/instruments/0e7a0d5f-3d2a-4bc1-8d4d-100000000001"
    Then the response status code should be 200
    And the response with ignored fields "createdAt" should be:
      """
      {
        "id": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "name": "Electric Guitar",
        "description": "Updated catalog description"
      }
      """

  Scenario: A bearer token without admin scope cannot update the catalog instrument
    Given An authenticated user "catalog-editor" with password "asdASD123!"
    When I send a PUT request to "/v1/instruments/0e7a0d5f-3d2a-4bc1-8d4d-100000000001" with body:
      """
      {
        "name": "Electric Guitar",
        "description": "Updated catalog description"
      }
      """
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Forbidden. User does not include one of the required roles permissions: admin-scope"
      }
      """

  Scenario: An unauthenticated request is rejected
    When I send a PUT request to "/v1/instruments/0e7a0d5f-3d2a-4bc1-8d4d-100000000001" with body:
      """
      {
        "name": "Electric Guitar",
        "description": "Updated catalog description"
      }
      """
    Then the response status code should be 401
    And the response should be:
      """
      {
        "code": "UNAUTHORIZED",
        "message": "No credentials provided."
      }
      """

  Scenario: An invalid request body is rejected before the update command runs
    Given An authenticated admin user "catalog-admin" with password "asdASD123!"
    When I send a PUT request to "/v1/instruments/0e7a0d5f-3d2a-4bc1-8d4d-100000000001" with body:
      """
      {
        "name": "Electric Guitar"
      }
      """
    Then the response status code should be 400

  Scenario: Updating a missing catalog instrument returns not found
    Given An authenticated admin user "catalog-admin" with password "asdASD123!"
    When I send a PUT request to "/v1/instruments/11111111-2222-4333-8444-555555555555" with body:
      """
      {
        "name": "Electric Guitar",
        "description": "Updated catalog description"
      }
      """
    Then the response status code should be 404
    And the response should be:
      """
      {
        "code": "INSTRUMENTS_NOT_EXISTS",
        "message": "The Instruments id <11111111-2222-4333-8444-555555555555> not exists."
      }
      """
