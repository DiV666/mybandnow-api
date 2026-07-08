Feature: login User
  In order to authenticate as a user
  As a User
  I want to be able to execute the login action

  Scenario: A valid existing user login
    Given I send a POST request to "/v1/users/register" with body:
    """
    {
      "id": "e6a00508-ea24-4fa4-a3cd-810a91557e5e",
      "email": "test@mybandnow.com",
      "password": "mypassword"
    }
    """
    And I send a POST request to "/v1/users/login" with body:
    """
    {
      "email": "test@mybandnow.com",
      "password": "mypassword"
    }
    """
    Then the response status code should be 200
    And the response should contain "accessToken"

  Scenario: A login attempt with wrong password
    Given I send a POST request to "/v1/users/register" with body:
    """
    {
      "id": "1c7a82b4-52d3-485a-8b9a-76d75c6e8e89",
      "email": "wrongpass@mybandnow.com",
      "password": "correctpassword"
    }
    """
    When I send a POST request to "/v1/users/login" with body:
    """
    {
      "email": "wrongpass@mybandnow.com",
      "password": "wrongpassword"
    }
    """
    Then the response status code should be 401
    And the response should be:
    """
    {
      "code": "INVALID_CREDENTIALS",
      "message": "The credentials provided are invalid"
    }
    """

  Scenario: A login attempt with non-existent user
    When I send a POST request to "/v1/users/login" with body:
    """
    {
      "email": "nonexistent@mybandnow.com",
      "password": "mypassword"
    }
    """
    Then the response status code should be 401
    And the response should be:
    """
    {
      "code": "INVALID_CREDENTIALS",
      "message": "The credentials provided are invalid"
    }
    """

  Scenario: A login attempt with missing fields
    When I send a POST request to "/v1/users/login" with body:
    """
    {
      "email": "missingpass@mybandnow.com"
    }
    """
    Then the response status code should be 400
